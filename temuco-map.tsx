"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

declare global {
  interface Window {
    L: any
  }
}

export default function Component() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    // Cargar Leaflet CSS y JS
    const loadLeaflet = async () => {
      if (typeof window !== "undefined" && !window.L) {
        // Cargar CSS
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)

        // Cargar JS
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = initializeMap
        document.head.appendChild(script)
      } else if (window.L) {
        initializeMap()
      }
    }

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Coordenadas de Temuco, Chile
      const temucoCoords: [number, number] = [-38.7359, -72.5904]

      // Inicializar el mapa
      const map = window.L.map(mapRef.current).setView(temucoCoords, 13)

      // Agregar tiles de OpenStreetMap
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      // Ubicaciones de interés en Temuco con sus coordenadas aproximadas
      const locations = [
        { id: 1, name: "Plaza Aníbal Pinto", coords: [-38.7359, -72.5904] as [number, number] },
        { id: 2, name: "Catedral de Temuco", coords: [-38.7355, -72.5898] as [number, number] },
        { id: 3, name: "Mercado Municipal", coords: [-38.7365, -72.5885] as [number, number] },
        { id: 4, name: "Universidad de La Frontera", coords: [-38.7458, -72.5986] as [number, number] },
        { id: 5, name: "Mall Portal Temuco", coords: [-38.7298, -72.6156] as [number, number] },
        { id: 6, name: "Estadio Germán Becker", coords: [-38.7189, -72.5745] as [number, number] },
        { id: 7, name: "Cerro Ñielol", coords: [-38.7189, -72.6089] as [number, number] },
        { id: 8, name: "Hospital Hernán Henríquez", coords: [-38.7456, -72.6234] as [number, number] },
        { id: 9, name: "Terminal de Buses", coords: [-38.7298, -72.5856] as [number, number] },
        { id: 10, name: "Aeropuerto Maquehue", coords: [-38.7667, -72.6378] as [number, number] },
      ]

      // Crear marcadores personalizados con números
      locations.forEach((location) => {
        // Crear un icono personalizado con el número
        const customIcon = window.L.divIcon({
          html: `<div style="
            background-color: #ef4444;
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${location.id}</div>`,
          className: "custom-marker",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        // Agregar marcador al mapa
        window.L.marker(location.coords, { icon: customIcon })
          .addTo(map)
          .bindPopup(`<strong>${location.id}. ${location.name}</strong>`)
      })

      mapInstanceRef.current = map
    }

    loadLeaflet()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Mapa de Temuco, Chile</CardTitle>
          <p className="text-center text-muted-foreground">
            Marcadores numerados del 1 al 10 en ubicaciones de interés
          </p>
        </CardHeader>
        <CardContent>
          <div ref={mapRef} className="w-full h-[500px] rounded-lg border" style={{ minHeight: "500px" }} />

          {/* Leyenda */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span>Plaza Aníbal Pinto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span>Catedral de Temuco</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span>Mercado Municipal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <span>Universidad de La Frontera</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <span>Mall Portal Temuco</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  6
                </div>
                <span>Estadio Germán Becker</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  7
                </div>
                <span>Cerro Ñielol</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  8
                </div>
                <span>Hospital Hernán Henríquez</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  9
                </div>
                <span>Terminal de Buses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  10
                </div>
                <span>Aeropuerto Maquehue</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
