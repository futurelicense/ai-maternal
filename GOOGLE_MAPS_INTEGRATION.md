# 🗺️ Google Maps Integration

## Overview

The Resource Allocation page now features a **real interactive Google Maps** visualization showing regional resource distribution with color-coded markers.

## Configuration

### Google Maps API Key
**Already configured:** `AIzaSyBnsGVYbKYK9Ao6LmKdbtCkYDPW9wIjHsI`

Located in: `.env`
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBnsGVYbKYK9Ao6LmKdbtCkYDPW9wIjHsI
```

## Features

### Interactive Map Markers
- **Color-coded** based on resource levels:
  - 🔴 **Red** - Critical shortage (<80% of average)
  - 🟠 **Orange** - Below average
  - 🟢 **Green** - Adequate resources

### Click for Details
Click any marker to see:
- Region name
- Resource status
- Current resource counts
- NICU Beds
- OB-GYN Staff
- Vaccine Stock percentage

### Dynamic Updates
- Automatically updates when switching resource types
- Shows real-time data from backend
- Color coding adjusts based on current averages

## Regional Coordinates

Pre-configured U.S. regions:
- **North County**: New York area
- **Central District**: Geographic center
- **South County**: Los Angeles area
- **East Region**: Boston area
- **West Region**: San Francisco area

## Usage

### In the Application
1. Go to **Resource Allocation** page
2. Select a resource type (NICU Beds, OB-GYN Staff, or Vaccine Stock)
3. View the interactive map showing regional distribution
4. Click markers for detailed information
5. Use map controls to zoom and pan

### Customizing Regions

To add or modify regions, update `src/components/ResourceMap.tsx`:

```typescript
const regionCoordinates: Record<string, { lat: number; lng: number }> = {
  'Your Region': { lat: 40.7128, lng: -74.0060 },
  // Add more regions...
};
```

## Map Controls

- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag
- **Fullscreen**: Click fullscreen button
- **Info**: Click markers for details

## API Configuration

### Required Google Maps APIs
Make sure these are enabled in your Google Cloud Console:
- Maps JavaScript API
- Geocoding API (optional, for address lookup)

### API Key Restrictions (Recommended)
For production, restrict your API key:
1. Go to Google Cloud Console
2. Select your API key
3. Add application restrictions:
   - **HTTP referrers**: `http://localhost:5173/*`, `https://yourdomain.com/*`
4. Add API restrictions:
   - **Maps JavaScript API**

## Troubleshooting

### Map not loading
- Check browser console for errors
- Verify API key is correct in `.env`
- Ensure Google Maps JavaScript API is enabled
- Check internet connection

### Markers not showing
- Verify resourceNeeds has data
- Check browser console for errors
- Ensure regions have coordinates defined

### Wrong locations
- Update coordinates in `ResourceMap.tsx`
- Match region names exactly
- Use latitude/longitude format

## Advanced Features

### Custom Marker Icons
You can customize marker appearance in `ResourceMap.tsx`:
```typescript
icon={{
  path: google.maps.SymbolPath.CIRCLE,
  scale: 12,
  fillColor: getMarkerColor(resource),
  fillOpacity: 0.8,
  strokeColor: '#ffffff',
  strokeWeight: 2,
}}
```

### Heat Map (Future Enhancement)
To add a heat map layer:
```bash
npm install @react-google-maps/api
```

Then use `<HeatmapLayer>` component.

### Clustering (Future Enhancement)
For many markers, add clustering:
```typescript
import { MarkerClusterer } from '@react-google-maps/api';
```

## Component Architecture

```
ResourceAllocation.tsx
    ↓
ResourceMap.tsx (Google Maps Component)
    ↓
@react-google-maps/api
    ↓
Google Maps JavaScript API
```

## Data Flow

1. **Backend** provides resource allocation data
2. **Frontend** fetches via API
3. **ResourceMap** receives data as props
4. **Google Maps** renders markers
5. **User** interacts with map
6. **InfoWindow** shows details on click

## Benefits

✅ **Real Geographic Visualization**
- Actual map-based resource distribution
- Interactive and intuitive

✅ **Color-Coded Insights**
- Instant visual identification of shortage areas
- Easy to spot resource gaps

✅ **Detailed Information**
- Click markers for full details
- All resource metrics in one place

✅ **Professional Presentation**
- Google Maps quality and reliability
- Familiar interface for users

## Production Considerations

### API Key Security
For production:
1. Use environment variables (already configured)
2. Add domain restrictions in Google Cloud Console
3. Monitor API usage
4. Set billing alerts

### Performance
- Map loads asynchronously
- Markers render efficiently
- InfoWindows on-demand

### Cost
- Google Maps offers free tier: 28,000 map loads/month
- Monitor usage in Google Cloud Console
- Optimize for production if needed

## Example Usage

```typescript
<ResourceMap 
  resources={resourceNeeds} 
  resourceType="nicuBeds" 
/>
```

## Files

- **Component**: `src/components/ResourceMap.tsx`
- **Usage**: `src/pages/ResourceAllocation.tsx`
- **Config**: `.env` (VITE_GOOGLE_MAPS_API_KEY)
- **Types**: `src/vite-env.d.ts`

---

**Your Google Maps integration is live and working!** 🗺️

View it at: http://localhost:5175 → Resource Allocation page

