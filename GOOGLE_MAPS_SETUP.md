# OpenStreetMap Setup Instructions

The interactive map now uses OpenStreetMap with Leaflet. No API key or billing account is required.

## What You Need

- Node packages: `leaflet` and `react-leaflet`
- An internet connection to load map tiles from OpenStreetMap

## Setup Steps

1. **Install Dependencies** (already added if you ran the install command)
   - `npm install leaflet react-leaflet`

2. **Map Component**
   - The map is implemented in `/src/app/components/MappingAreas.tsx`
   - It uses OpenStreetMap tiles and Leaflet markers


## Tile Provider Notes

- OpenStreetMap tiles are free but have usage limits for heavy traffic
- For production-scale traffic, consider a dedicated tile provider or self-hosted tiles

## Need Help?

- Leaflet docs: https://leafletjs.com/
- React-Leaflet docs: https://react-leaflet.js.org/
