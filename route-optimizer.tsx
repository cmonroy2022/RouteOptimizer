"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Route, Square, RotateCcw, Navigation } from "lucide-react"
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { LoginForm } from "@/components/login-form"
import { UserMenu } from "@/components/user-menu"

declare global {
  interface Window {
    L: any
    XLSX: any
  }
}

interface Location {
  id: string
  direccion: string
  latitud: number
  longitud: number
  distancia_km: number
  visited: boolean
  inSector: boolean
}

interface Sector {
  bounds: [[number, number], [number, number]] | null
}

interface RouteSegment {
  from: Location
  to: Location
  distance: number
  duration: number
  geometry: [number, number][]
}

function MobileControls({
  locations,
  handleFileUpload,
  fileInputRef,
  toggleAreaSelection,
  isSelectingArea,
  calculateOptimalRoute,
  isCalculatingRoute,
  resetAll,
  totalDistance,
  totalDuration,
  optimalRoute,
  routeSegments,
  toggleVisited,
  getUserLocation,
  isTrackingLocation,
  locationError,
}: {
  locations: Location[]
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement>
  toggleAreaSelection: () => void
  isSelectingArea: boolean
  calculateOptimalRoute: () => void
  isCalculatingRoute: boolean
  resetAll: () => void
  totalDistance: number
  totalDuration: number
  optimalRoute: Location[]
  routeSegments: RouteSegment[]
  toggleVisited: (locationId: string) => void
  getUserLocation: () => void
  isTrackingLocation: boolean
  locationError: string | null
}) {
  return (
    <div className="space-y-4 p-4">
      {/* Controles principales */}
      <div className="space-y-4">
        <div className="w-full">
          <Label htmlFor="excel-file-mobile">Subir archivo Excel</Label>
          <Input
            id="excel-file-mobile"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="mt-1"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            onClick={getUserLocation}
            disabled={isTrackingLocation}
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 text-sm"
          >
            {isTrackingLocation ? (
              <>
                <Navigation className="w-4 h-4 animate-spin" />
                Obteniendo ubicación...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                Mi Ubicación
              </>
            )}
          </Button>
          <Button
            onClick={toggleAreaSelection}
            variant={isSelectingArea ? "destructive" : "outline"}
            className="flex items-center justify-center gap-2 h-12 text-sm"
          >
            <Square className="w-4 h-4" />
            {isSelectingArea ? "Cancelar (Haz 2 clics)" : "Seleccionar Área"}
          </Button>
          <Button
            onClick={calculateOptimalRoute}
            disabled={locations.filter((l) => l.inSector && !l.visited).length < 2 || isCalculatingRoute}
            className="flex items-center justify-center gap-2 h-12 text-sm"
          >
            {isCalculatingRoute ? (
              <>
                <Navigation className="w-4 h-4 animate-spin" />
                Calculando...
              </>
            ) : (
              <>
                <Route className="w-4 h-4" />
                Calcular Ruta Real
              </>
            )}
          </Button>
          <Button onClick={resetAll} variant="outline" className="flex items-center justify-center gap-2 h-12 text-sm">
            <RotateCcw className="w-4 h-4" />
            Resetear
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Total: {locations.length} ubicaciones</Badge>
          <Badge variant="default">En sector: {locations.filter((l) => l.inSector).length}</Badge>
          <Badge variant="outline">Visitadas: {locations.filter((l) => l.visited).length}</Badge>
          {totalDistance > 0 && (
            <>
              <Badge variant="destructive">Distancia: {totalDistance.toFixed(2)} km</Badge>
              <Badge variant="destructive">Tiempo: {Math.round(totalDuration)} min</Badge>
            </>
          )}
        </div>
      )}

      {/* Lista de ubicaciones */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold">Ubicaciones en Sector</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {locations
            .filter((l) => l.inSector)
            .sort((a, b) => {
              if (optimalRoute.length > 0) {
                const indexA = optimalRoute.findIndex((r) => r.id === a.id)
                const indexB = optimalRoute.findIndex((r) => r.id === b.id)
                if (indexA === -1) return 1
                if (indexB === -1) return -1
                return indexA - indexB
              }
              return 0
            })
            .map((location, index) => {
              const routeIndex = optimalRoute.findIndex((r) => r.id === location.id)
              return (
                <div
                  key={location.id}
                  className={`p-2 border rounded-lg ${location.visited ? "bg-gray-50 opacity-60" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {routeIndex >= 0 && (
                          <Badge variant="default" className="text-xs">
                            {routeIndex + 1}
                          </Badge>
                        )}
                        <p className="font-medium text-xs">{location.direccion}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{location.distancia_km} km</p>
                      {routeIndex >= 0 && routeSegments[routeIndex] && (
                        <p className="text-xs text-green-600">
                          Distancia real: {routeSegments[routeIndex].distance.toFixed(2)} km (
                          {Math.round(routeSegments[routeIndex].duration)} min)
                        </p>
                      )}
                    </div>
                    <Checkbox
                      checked={location.visited}
                      onCheckedChange={() => toggleVisited(location.id)}
                      className="ml-2"
                    />
                  </div>
                </div>
              )
            })}
          {locations.filter((l) => l.inSector).length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Selecciona un área en el mapa para ver las ubicaciones
            </p>
          )}
        </div>
      </div>
      {/* Error de ubicación */}
      {locationError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{locationError}</p>
        </div>
      )}
    </div>
  )
}

function RouteOptimizerApp() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [locations, setLocations] = useState<Location[]>([])
  const [selectedSector, setSelectedSector] = useState<Sector>({ bounds: null })
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [optimalRoute, setOptimalRoute] = useState<Location[]>([])
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [isLibrariesLoaded, setIsLibrariesLoaded] = useState(false)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [isTrackingLocation, setIsTrackingLocation] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const userLocationMarkerRef = useRef<any>(null)

  const { user } = useAuth()

  // Cargar librerías externas
  useEffect(() => {
    const loadLibraries = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Cargar Leaflet CSS
        const leafletCSS = document.createElement("link")
        leafletCSS.rel = "stylesheet"
        leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(leafletCSS)

        // Cargar Leaflet JS
        const leafletScript = document.createElement("script")
        leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"

        // Cargar XLSX
        const xlsxScript = document.createElement("script")
        xlsxScript.src = "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js"

        await Promise.all([
          new Promise((resolve) => {
            leafletScript.onload = resolve
            document.head.appendChild(leafletScript)
          }),
          new Promise((resolve) => {
            xlsxScript.onload = resolve
            document.head.appendChild(xlsxScript)
          }),
        ])

        setIsLibrariesLoaded(true)
      } else if (window.L && window.XLSX) {
        setIsLibrariesLoaded(true)
      }
    }

    loadLibraries()
  }, [])

  // Inicializar mapa
  useEffect(() => {
    if (!isLibrariesLoaded || !mapRef.current || mapInstanceRef.current) return

    const temucoCoords: [number, number] = [-38.7359, -72.5904]
    const map = window.L.map(mapRef.current).setView(temucoCoords, 12)

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLibrariesLoaded])

  // Add this after the map initialization useEffect
  useEffect(() => {
    if (mapInstanceRef.current && isMobile) {
      // Ensure map container has proper z-index on mobile
      const mapContainer = mapRef.current
      if (mapContainer) {
        mapContainer.style.zIndex = "10"
      }
    }
  }, [isMobile, isLibrariesLoaded])

  // Procesar archivo Excel
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !window.XLSX) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = window.XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet)

        const processedLocations: Location[] = jsonData.map((row: any, index: number) => ({
          id: `loc-${index}`,
          direccion: row.Direccion || row.direccion || "",
          latitud: Number.parseFloat(row.Latitud || row.latitud || 0),
          longitud: Number.parseFloat(row.Longitud || row.longitud || 0),
          distancia_km: Number.parseFloat(row.Distancia_km || row.distancia_km || 0),
          visited: false,
          inSector: false,
        }))

        setLocations(processedLocations)
        updateMapMarkers(processedLocations)
      } catch (error) {
        console.error("Error procesando archivo:", error)
        alert("Error al procesar el archivo Excel")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Actualizar marcadores en el mapa
  const updateMapMarkers = useCallback(
    (locs: Location[], currentRoute: Location[] = []) => {
      if (!mapInstanceRef.current) return

      // Limpiar marcadores existentes (excepto el de ubicación del usuario)
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (layer instanceof window.L.Marker && layer !== userLocationMarkerRef.current) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })

      // Agregar nuevos marcadores
      locs.forEach((location, index) => {
        if (location.latitud && location.longitud) {
          const color = location.visited ? "#6b7280" : location.inSector ? "#ef4444" : "#3b82f6"

          // Mostrar número de orden si está en la ruta
          const routeIndex = currentRoute.findIndex((r) => r.id === location.id)
          const displayText = routeIndex >= 0 ? (routeIndex + 1).toString() : "•"

          const icon = window.L.divIcon({
            html: `<div style="
          background-color: ${color};
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ${location.visited ? "opacity: 0.5;" : ""}
        ">${displayText}</div>`,
            className: "custom-marker",
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })

          window.L.marker([location.latitud, location.longitud], { icon })
            .addTo(mapInstanceRef.current)
            .bindPopup(`
          <strong>${location.direccion}</strong><br>
          Distancia: ${location.distancia_km} km<br>
          Estado: ${location.visited ? "Visitado" : "Pendiente"}
          ${routeIndex >= 0 ? `<br>Orden en ruta: ${routeIndex + 1}` : ""}
        `)
        }
      })

      // Restaurar el marcador de ubicación del usuario si existe
      if (userLocation && userLocationMarkerRef.current) {
        if (!mapInstanceRef.current.hasLayer(userLocationMarkerRef.current)) {
          userLocationMarkerRef.current.addTo(mapInstanceRef.current)
        }
      }
    },
    [userLocation],
  )

  // Obtener ruta real entre dos puntos usando OSRM
  const getRealRoute = async (from: Location, to: Location): Promise<RouteSegment | null> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.longitud},${from.latitud};${to.longitud},${to.latitud}?overview=full&geometries=geojson`,
      )

      if (!response.ok) throw new Error("Error en la respuesta del servidor")

      const data = await response.json()

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0]
        return {
          from,
          to,
          distance: route.distance / 1000, // Convertir a km
          duration: route.duration / 60, // Convertir a minutos
          geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]), // Invertir lat/lng
        }
      }

      return null
    } catch (error) {
      console.error("Error obteniendo ruta real:", error)
      // Fallback a distancia en línea recta
      const distance = calculateDistance(from.latitud, from.longitud, to.latitud, to.longitud)
      return {
        from,
        to,
        distance,
        duration: distance * 2, // Estimación: 2 minutos por km
        geometry: [
          [from.latitud, from.longitud],
          [to.latitud, to.longitud],
        ],
      }
    }
  }

  // Seleccionar área rectangular
  const toggleAreaSelection = () => {
    if (!mapInstanceRef.current) return

    if (isSelectingArea) {
      setIsSelectingArea(false)
      return
    }

    setIsSelectingArea(true)

    let clickCount = 0
    let firstPoint: [number, number] | null = null
    let tempRectangle: any = null

    const onMapClick = (e: any) => {
      clickCount++

      if (clickCount === 1) {
        firstPoint = [e.latlng.lat, e.latlng.lng]
        // Mostrar un marcador temporal para el primer punto
        window.L.marker(firstPoint, {
          icon: window.L.divIcon({
            html: '<div style="background-color: #ff7800; color: white; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px;">1</div>',
            iconSize: [15, 15],
            iconAnchor: [7.5, 7.5],
          }),
        }).addTo(mapInstanceRef.current)
      } else if (clickCount === 2 && firstPoint) {
        const secondPoint: [number, number] = [e.latlng.lat, e.latlng.lng]

        // Crear el rectángulo con los dos puntos
        const bounds = window.L.latLngBounds([firstPoint, secondPoint])

        // Limpiar marcadores temporales
        mapInstanceRef.current.eachLayer((layer: any) => {
          if (layer instanceof window.L.Marker && layer.options.icon?.options?.html?.includes("1")) {
            mapInstanceRef.current.removeLayer(layer)
          }
        })

        // Crear el rectángulo
        tempRectangle = window.L.rectangle(bounds, {
          color: "#ff7800",
          weight: 2,
          fillOpacity: 0.1,
        }).addTo(mapInstanceRef.current)

        // Actualizar el sector seleccionado
        setSelectedSector({
          bounds: [
            [bounds.getSouth(), bounds.getWest()],
            [bounds.getNorth(), bounds.getEast()],
          ],
        })

        updateLocationsInSector(bounds)
        setIsSelectingArea(false)

        // Remover el event listener
        mapInstanceRef.current.off("click", onMapClick)
      }
    }

    // Agregar event listener para clics en el mapa
    mapInstanceRef.current.on("click", onMapClick)
  }

  // Actualizar ubicaciones en el sector seleccionado
  const updateLocationsInSector = (bounds: any) => {
    const updatedLocations = locations.map((loc) => ({
      ...loc,
      inSector: bounds.contains([loc.latitud, loc.longitud]),
    }))
    setLocations(updatedLocations)
    updateMapMarkers(updatedLocations)
  }

  // Calcular distancia entre dos puntos (fórmula de Haversine) - Fallback
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Marcar ubicación como visitada
  const toggleVisited = (locationId: string) => {
    const updatedLocations = locations.map((loc) => (loc.id === locationId ? { ...loc, visited: !loc.visited } : loc))
    setLocations(updatedLocations)
    // Actualizar marcadores para reflejar el cambio de estado visitado
    updateMapMarkers(updatedLocations, optimalRoute)
  }

  // Obtener ubicación del usuario
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalización no soportada en este navegador")
      return
    }

    setIsTrackingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newUserLocation: [number, number] = [latitude, longitude]
        setUserLocation(newUserLocation)
        setIsTrackingLocation(false)

        // Centrar el mapa en la ubicación del usuario
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(newUserLocation, 15)
        }

        updateUserLocationMarker(newUserLocation)
      },
      (error) => {
        setIsTrackingLocation(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permiso de ubicación denegado")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Ubicación no disponible")
            break
          case error.TIMEOUT:
            setLocationError("Tiempo de espera agotado")
            break
          default:
            setLocationError("Error desconocido al obtener ubicación")
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }

  // Actualizar marcador de ubicación del usuario
  const updateUserLocationMarker = (location: [number, number]) => {
    if (!mapInstanceRef.current) return

    // Remover marcador anterior si existe
    if (userLocationMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userLocationMarkerRef.current)
    }

    // Crear nuevo marcador de usuario
    const userIcon = window.L.divIcon({
      html: `<div style="
      background-color: #10b981;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
      position: relative;
    ">📍</div>
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      border: 2px solid #10b981;
      border-radius: 50%;
      background-color: rgba(16, 185, 129, 0.1);
      animation: pulse 2s infinite;
    "></div>`,
      className: "user-location-marker",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })

    userLocationMarkerRef.current = window.L.marker(location, { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup("📍 Tu ubicación actual")

    // Agregar CSS para la animación
    if (!document.getElementById("user-location-styles")) {
      const style = document.createElement("style")
      style.id = "user-location-styles"
      style.textContent = `
      @keyframes pulse {
        0% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.5);
          opacity: 0;
        }
      }
    `
      document.head.appendChild(style)
    }
  }

  // Algoritmo de ruta óptima considerando calles reales
  const calculateOptimalRoute = async () => {
    const availableLocations = locations.filter((loc) => loc.inSector && !loc.visited)
    if (availableLocations.length < 1) return

    setIsCalculatingRoute(true)

    try {
      // Si hay ubicación del usuario, crear una ubicación virtual para incluirla en el cálculo
      let locationsToProcess = [...availableLocations]
      let startFromUserLocation = false

      if (userLocation) {
        const userLocationAsLocation: Location = {
          id: "user-location",
          direccion: "Mi Ubicación",
          latitud: userLocation[0],
          longitud: userLocation[1],
          distancia_km: 0,
          visited: false,
          inSector: true,
        }
        locationsToProcess = [userLocationAsLocation, ...availableLocations]
        startFromUserLocation = true
      }

      if (locationsToProcess.length < 2) return

      // Crear matriz de distancias reales
      const distanceMatrix: number[][] = []
      const routeMatrix: RouteSegment[][] = []

      // Inicializar matrices
      for (let i = 0; i < locationsToProcess.length; i++) {
        distanceMatrix[i] = []
        routeMatrix[i] = []
        for (let j = 0; j < locationsToProcess.length; j++) {
          if (i === j) {
            distanceMatrix[i][j] = 0
            routeMatrix[i][j] = {
              from: locationsToProcess[i],
              to: locationsToProcess[j],
              distance: 0,
              duration: 0,
              geometry: [],
            }
          } else {
            // Obtener ruta real entre puntos
            const segment = await getRealRoute(locationsToProcess[i], locationsToProcess[j])
            if (segment) {
              distanceMatrix[i][j] = segment.distance
              routeMatrix[i][j] = segment
            } else {
              // Fallback
              const distance = calculateDistance(
                locationsToProcess[i].latitud,
                locationsToProcess[i].longitud,
                locationsToProcess[j].latitud,
                locationsToProcess[j].longitud,
              )
              distanceMatrix[i][j] = distance
              routeMatrix[i][j] = {
                from: locationsToProcess[i],
                to: locationsToProcess[j],
                distance,
                duration: distance * 2,
                geometry: [
                  [locationsToProcess[i].latitud, locationsToProcess[i].longitud],
                  [locationsToProcess[j].latitud, locationsToProcess[j].longitud],
                ],
              }
            }
          }
        }
      }

      // Algoritmo Nearest Neighbor con distancias reales
      const route: Location[] = []
      const segments: RouteSegment[] = []
      const unvisited = [...Array(locationsToProcess.length).keys()]

      // Si hay ubicación del usuario, empezar desde ahí (índice 0), sino desde el primer punto disponible
      let currentIndex = startFromUserLocation ? 0 : 0

      route.push(locationsToProcess[currentIndex])
      unvisited.splice(unvisited.indexOf(currentIndex), 1)

      let totalDist = 0
      let totalTime = 0

      while (unvisited.length > 0) {
        let nearestIndex = unvisited[0]
        let nearestDistance = distanceMatrix[currentIndex][nearestIndex]

        // Encontrar el punto más cercano
        unvisited.forEach((index) => {
          if (distanceMatrix[currentIndex][index] < nearestDistance) {
            nearestDistance = distanceMatrix[currentIndex][index]
            nearestIndex = index
          }
        })

        // Agregar el segmento de ruta
        const segment = routeMatrix[currentIndex][nearestIndex]
        segments.push(segment)

        route.push(locationsToProcess[nearestIndex])
        totalDist += nearestDistance
        totalTime += segment.duration

        currentIndex = nearestIndex
        unvisited.splice(unvisited.indexOf(nearestIndex), 1)
      }

      // Filtrar la ubicación del usuario de la ruta final para mostrar solo las ubicaciones reales
      const finalRoute = startFromUserLocation ? route.filter((loc) => loc.id !== "user-location") : route

      setOptimalRoute(finalRoute)
      setRouteSegments(segments)
      setTotalDistance(totalDist)
      setTotalDuration(totalTime)
      drawRealRouteOnMap(segments)

      // Actualizar marcadores con números usando la ruta recién calculada
      updateMapMarkers(locations, finalRoute)
    } catch (error) {
      console.error("Error calculando ruta óptima:", error)
      alert("Error al calcular la ruta óptima")
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // Dibujar ruta real en el mapa
  const drawRealRouteOnMap = (segments: RouteSegment[]) => {
    if (!mapInstanceRef.current) return

    // Limpiar rutas existentes
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Polyline) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    if (segments.length === 0) return

    // Dibujar cada segmento de la ruta
    segments.forEach((segment, index) => {
      const color = `hsl(${(index * 360) / segments.length}, 70%, 50%)`

      window.L.polyline(segment.geometry, {
        color: "#ef4444",
        weight: 4,
        opacity: 0.8,
      }).addTo(mapInstanceRef.current)
    })
  }

  // Resetear todo
  const resetAll = () => {
    setLocations([])
    setSelectedSector({ bounds: null })
    setOptimalRoute([])
    setRouteSegments([])
    setTotalDistance(0)
    setTotalDuration(0)
    setUserLocation(null)
    setLocationError(null)

    if (mapInstanceRef.current) {
      mapInstanceRef.current.eachLayer((layer: any) => {
        if (
          layer instanceof window.L.Marker ||
          layer instanceof window.L.Polyline ||
          layer instanceof window.L.Rectangle
        ) {
          mapInstanceRef.current.removeLayer(layer)
        }
      })
    }

    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current = null
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-2 sm:p-4 space-y-2 sm:space-y-4">
      {isMobile ? (
        <SidebarProvider>
          <Sidebar side="left" variant="sidebar" className="w-80 z-50">
            <SidebarHeader>
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="Logo" width={40} height={40} className="rounded-full" />
                <div>
                  <h2 className="text-lg font-bold">RouteOptimizer</h2>
                  <p className="text-xs text-muted-foreground">Optimiza tus rutas</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  💡 Haz zoom con pellizco y arrastra para navegar el mapa
                </p>
                <UserMenu />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <MobileControls
                locations={locations}
                handleFileUpload={handleFileUpload}
                fileInputRef={fileInputRef}
                toggleAreaSelection={toggleAreaSelection}
                isSelectingArea={isSelectingArea}
                calculateOptimalRoute={calculateOptimalRoute}
                isCalculatingRoute={isCalculatingRoute}
                resetAll={resetAll}
                totalDistance={totalDistance}
                totalDuration={totalDuration}
                optimalRoute={optimalRoute}
                routeSegments={routeSegments}
                toggleVisited={toggleVisited}
                getUserLocation={getUserLocation}
                isTrackingLocation={isTrackingLocation}
                locationError={locationError}
              />
            </SidebarContent>
          </Sidebar>
          <main className="flex-1 relative">
            <div className="flex items-center justify-between p-4 border-b bg-background z-40 relative">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Image src="/logo.svg" alt="Logo" width={32} height={32} className="rounded-full" />
                <h1 className="text-lg font-bold">RouteOptimizer</h1>
              </div>
              <UserMenu />
            </div>
            <div className="p-4">
              <Card>
                <CardContent className="p-4">
                  <div ref={mapRef} className="w-full h-[calc(100vh-200px)] rounded-lg border relative z-10" />
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarProvider>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Image src="/logo.svg" alt="Logo" width={60} height={60} className="rounded-full" />
                  <div>
                    <CardTitle className="text-2xl font-bold">RouteOptimizer - Temuco</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      Sube tu archivo Excel, selecciona un sector y optimiza tu ruta considerando las calles reales
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <UserMenu />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Controles principales */}
              <div className="space-y-4">
                <div className="w-full">
                  <Label htmlFor="excel-file">Subir archivo Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="mt-1"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={getUserLocation}
                    disabled={isTrackingLocation}
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-12 text-sm"
                  >
                    {isTrackingLocation ? (
                      <>
                        <Navigation className="w-4 h-4 animate-spin" />
                        Obteniendo ubicación...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Mi Ubicación
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={toggleAreaSelection}
                    variant={isSelectingArea ? "destructive" : "outline"}
                    className="flex items-center justify-center gap-2 h-12 text-sm"
                  >
                    <Square className="w-4 h-4" />
                    {isSelectingArea ? "Cancelar (Haz 2 clics)" : "Seleccionar Área"}
                  </Button>
                  <Button
                    onClick={calculateOptimalRoute}
                    disabled={locations.filter((l) => l.inSector && !l.visited).length < 1 || isCalculatingRoute}
                    className="flex items-center justify-center gap-2 h-12 text-sm"
                  >
                    {isCalculatingRoute ? (
                      <>
                        <Navigation className="w-4 h-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        <Route className="w-4 h-4" />
                        {userLocation ? "Calcular desde Mi Ubicación" : "Calcular Ruta Real"}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={resetAll}
                    variant="outline"
                    className="flex items-center justify-center gap-2 h-12 text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Resetear
                  </Button>
                </div>
              </div>

              {/* Estadísticas */}
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <Badge variant="secondary">Total: {locations.length} ubicaciones</Badge>
                  <Badge variant="default">En sector: {locations.filter((l) => l.inSector).length}</Badge>
                  <Badge variant="outline">Visitadas: {locations.filter((l) => l.visited).length}</Badge>
                  {totalDistance > 0 && (
                    <>
                      <Badge variant="destructive">Distancia: {totalDistance.toFixed(2)} km</Badge>
                      <Badge variant="destructive">Tiempo: {Math.round(totalDuration)} min</Badge>
                    </>
                  )}
                </div>
              )}
              {/* Error de ubicación */}
              {locationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{locationError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Mapa */}
            <Card className="lg:col-span-2">
              <CardContent className="p-4">
                <div ref={mapRef} className="w-full h-[500px] rounded-lg border" />
              </CardContent>
            </Card>

            {/* Lista de ubicaciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ubicaciones en Sector</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
                {locations
                  .filter((l) => l.inSector)
                  .sort((a, b) => {
                    if (optimalRoute.length > 0) {
                      const indexA = optimalRoute.findIndex((r) => r.id === a.id)
                      const indexB = optimalRoute.findIndex((r) => r.id === b.id)
                      if (indexA === -1) return 1
                      if (indexB === -1) return -1
                      return indexA - indexB
                    }
                    return 0
                  })
                  .map((location, index) => {
                    const routeIndex = optimalRoute.findIndex((r) => r.id === location.id)
                    return (
                      <div
                        key={location.id}
                        className={`p-3 border rounded-lg ${location.visited ? "bg-gray-50 opacity-60" : "bg-white"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {routeIndex >= 0 && (
                                <Badge variant="default" className="text-xs">
                                  {routeIndex + 1}
                                </Badge>
                              )}
                              <p className="font-medium text-sm">{location.direccion}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{location.distancia_km} km</p>
                            {routeIndex >= 0 && routeSegments[routeIndex] && (
                              <p className="text-xs text-green-600">
                                Distancia real: {routeSegments[routeIndex].distance.toFixed(2)} km (
                                {Math.round(routeSegments[routeIndex].duration)} min)
                              </p>
                            )}
                          </div>
                          <Checkbox
                            checked={location.visited}
                            onCheckedChange={() => toggleVisited(location.id)}
                            className="ml-2"
                          />
                        </div>
                      </div>
                    )
                  })}
                {locations.filter((l) => l.inSector).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Selecciona un área en el mapa para ver las ubicaciones
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default function Component() {
  const { isAuthenticated, login } = useAuth()

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />
  }

  return <RouteOptimizerApp />
}
