# Site Maps Enhancement Implementation Guide

## Overview
This document outlines the enhancements made to the Site Maps Builder feature to replace `prompt()` dialogs with professional modal components and add edit/delete functionality for map items.

## Files Created/Modified

### 1. `/app/web-admin/components/SiteMapModals.tsx` ✅ CREATED
Professional modal components for:
- **MeasurementModal**: For distance and area measurements with live calculations
- **AnnotationModal**: For adding labeled annotations with category selection
- **EditItemModal**: For editing/deleting existing map items

### 2. `/app/web-admin/app/sites/[id]/maps/page.tsx` ⚠️ PARTIALLY MODIFIED
Needs the following integrations:

#### A. Import the Modal Components (add to top of file)
```typescript
import { MeasurementModal, AnnotationModal, EditItemModal } from '@/components/SiteMapModals';
```

#### B. Handler Functions to Add

```typescript
  // Handler for saving measurement from modal
  const handleSaveMeasurement = (label: string) => {
    if (!pendingMeasurement) return;
    
    const { overlay, type, distanceFeet, distanceMeters, distanceMiles, path, areaSquareFeet, areaSquareMeters, areaAcres, perimeterFeet } = pendingMeasurement;
    
    // Create info window
    let content = '';
    let midPoint;
    
    if (type === 'distance') {
      midPoint = path.getAt(Math.floor(path.getLength() / 2));
      content = `
        <div style="padding: 12px; font-family: sans-serif;">
          <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
          <div style="margin-top: 8px; font-size: 13px;">
            <strong>${distanceFeet.toFixed(2)}</strong> feet<br/>
            <strong>${distanceMeters.toFixed(2)}</strong> meters<br/>
            <strong>${distanceMiles.toFixed(3)}</strong> miles
          </div>
        </div>
      `;
    } else {
      const bounds = new window.google.maps.LatLngBounds();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      midPoint = bounds.getCenter();
      content = `
        <div style="padding: 12px; font-family: sans-serif;">
          <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
          <div style="margin-top: 8px; font-size: 13px;">
            <strong>Area:</strong><br/>
            ${areaSquareFeet.toLocaleString()} sq ft<br/>
            ${areaSquareMeters.toLocaleString()} sq m<br/>
            ${areaAcres.toFixed(4)} acres<br/>
            <strong>Perimeter:</strong><br/>
            ${perimeterFeet.toFixed(2)} feet
          </div>
        </div>
      `;
    }
    
    const infoWindow = new window.google.maps.InfoWindow({
      position: midPoint,
      content,
    });
    infoWindow.open(mapRef.current);
    overlaysRef.current.push(infoWindow);
    
    const measurement = {
      id: Date.now().toString(),
      type,
      label,
      ...(type === 'distance' ? {
        distanceFeet: distanceFeet.toFixed(2),
        distanceMeters: distanceMeters.toFixed(2),
        distanceMiles: distanceMiles.toFixed(3),
      } : {
        areaSquareFeet: areaSquareFeet.toLocaleString(),
        areaSquareMeters: areaSquareMeters.toLocaleString(),
        areaAcres: areaAcres.toFixed(4),
        perimeterFeet: perimeterFeet.toFixed(2),
      }),
      overlay,
      infoWindow,
    };
    
    setMeasurements([...measurements, measurement]);
    setShowMeasurementModal(false);
    setPendingMeasurement(null);
    setActiveTool(null);
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  // Handler for saving annotation from modal
  const handleSaveAnnotation = (label: string, category: string) => {
    if (!pendingAnnotation) return;
    
    const { overlay, type } = pendingAnnotation;
    
    // Create info window
    let center;
    if (type === 'marker') {
      center = overlay.getPosition();
    } else if (type === 'circle') {
      center = overlay.getCenter();
    } else if (type === 'rectangle') {
      const bounds = overlay.getBounds();
      center = bounds.getCenter();
    } else if (type === 'polygon') {
      const path = overlay.getPath();
      const bounds = new window.google.maps.LatLngBounds();
      for (let i = 0; i < path.getLength(); i++) {
        bounds.extend(path.getAt(i));
      }
      center = bounds.getCenter();
    }
    
    if (center) {
      const infoWindow = new window.google.maps.InfoWindow({
        position: center,
        content: `
          <div style="padding: 8px; font-family: sans-serif;">
            <strong style="font-size: 13px; color: #1f2937;">${label}</strong><br/>
            <span style="font-size: 11px; color: #6b7280;">
              ${ANNOTATION_CATEGORIES.find(c => c.value === category)?.label}
            </span>
          </div>
        `,
      });
      
      window.google.maps.event.addListener(overlay, 'click', () => {
        setEditingItem(annotation);
        setShowEditModal(true);
      });
      
      infoWindow.open(mapRef.current);
      overlaysRef.current.push(infoWindow);
    }
    
    const annotation = {
      id: Date.now().toString(),
      type,
      category,
      label,
      color: selectedColor,
      overlay,
    };
    
    setAnnotations([...annotations, annotation]);
    setShowAnnotationModal(false);
    setPendingAnnotation(null);
    setActiveTool(null);
    
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(null);
    }
  };

  // Handler for editing item
  const handleEditItem = (label: string) => {
    if (!editingItem) return;
    
    // Update label in the item
    editingItem.label = label;
    
    // Update info window if it exists
    if (editingItem.infoWindow) {
      let content = '';
      if (editingItem.type === 'distance') {
        content = `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>${editingItem.distanceFeet}</strong> feet<br/>
              <strong>${editingItem.distanceMeters}</strong> meters<br/>
              <strong>${editingItem.distanceMiles}</strong> miles
            </div>
          </div>
        `;
      } else if (editingItem.type === 'area') {
        content = `
          <div style="padding: 12px; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #1f2937;">${label}</strong><br/>
            <div style="margin-top: 8px; font-size: 13px;">
              <strong>Area:</strong><br/>
              ${editingItem.areaSquareFeet} sq ft<br/>
              ${editingItem.areaSquareMeters} sq m<br/>
              ${editingItem.areaAcres} acres<br/>
              <strong>Perimeter:</strong><br/>
              ${editingItem.perimeterFeet} feet
            </div>
          </div>
        `;
      } else {
        content = `
          <div style="padding: 8px; font-family: sans-serif;">
            <strong style="font-size: 13px; color: #1f2937;">${label}</strong><br/>
            <span style="font-size: 11px; color: #6b7280;">
              ${ANNOTATION_CATEGORIES.find(c => c.value === editingItem.category)?.label || ''}
            </span>
          </div>
        `;
      }
      editingItem.infoWindow.setContent(content);
    }
    
    // Force re-render
    setMeasurements([...measurements]);
    setAnnotations([...annotations]);
    setShowEditModal(false);
    setEditingItem(null);
  };

  // Handler for deleting item
  const handleDeleteItem = () => {
    if (!editingItem) return;
    
    // Remove overlay from map
    if (editingItem.overlay) {
      editingItem.overlay.setMap(null);
    }
    
    // Remove info window
    if (editingItem.infoWindow) {
      editingItem.infoWindow.close();
    }
    
    // Remove from state
    if (editingItem.type === 'distance' || editingItem.type === 'area') {
      setMeasurements(measurements.filter(m => m.id !== editingItem.id));
    } else {
      setAnnotations(annotations.filter(a => a.id !== editingItem.id));
    }
    
    setShowEditModal(false);
    setEditingItem(null);
  };
```

#### C. Modify Area Measurement Section (line ~440)
Replace the `prompt()` call with modal trigger:

```typescript
    } else if (activeTool === 'measure-area') {
      // Area measurement
      const path = overlay.getPath();
      const areaSquareMeters = window.google.maps.geometry.spherical.computeArea(path);
      const areaSquareFeet = areaSquareMeters * 10.764;
      const areaAcres = areaSquareMeters * 0.000247105;
      
      // Calculate perimeter
      let perimeter = 0;
      for (let i = 0; i < path.getLength(); i++) {
        const from = path.getAt(i);
        const to = path.getAt((i + 1) % path.getLength());
        perimeter += window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
      }
      const perimeterFeet = perimeter * 3.28084;
      
      // Store pending measurement and show modal
      setPendingMeasurement({
        overlay,
        type: 'area',
        areaSquareFeet,
        areaSquareMeters,
        areaAcres,
        perimeterFeet,
        path
      });
      setModalLabel('Area Measurement');
      setShowMeasurementModal(true);
```

#### D. Modify Annotation Sections (line ~499 and ~534)
Replace `prompt()` calls with modal trigger:

```typescript
    } else if (activeTool === 'marker') {
      // Icon marker with label
      setPendingAnnotation({
        overlay,
        type: 'marker'
      });
      setShowAnnotationModal(true);
      
    } else {
      // Regular annotation shapes
      setPendingAnnotation({
        overlay,
        type
      });
      setShowAnnotationModal(true);
    }
```

#### E. Add Modal Components at End of JSX (before closing return)
```tsx
      {/* Modal Dialogs */}
      <MeasurementModal
        show={showMeasurementModal}
        onClose={() => {
          setShowMeasurementModal(false);
          setPendingMeasurement(null);
          if (pendingMeasurement?.overlay) {
            pendingMeasurement.overlay.setMap(null);
          }
        }}
        onSave={handleSaveMeasurement}
        measurementData={pendingMeasurement}
        initialLabel={modalLabel}
      />

      <AnnotationModal
        show={showAnnotationModal}
        onClose={() => {
          setShowAnnotationModal(false);
          setPendingAnnotation(null);
          if (pendingAnnotation?.overlay) {
            pendingAnnotation.overlay.setMap(null);
          }
        }}
        onSave={handleSaveAnnotation}
        initialLabel=""
        initialCategory={selectedCategory}
        categories={ANNOTATION_CATEGORIES}
      />

      <EditItemModal
        show={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        onSave={handleEditItem}
        onDelete={handleDeleteItem}
        item={editingItem}
      />
```

## Features Enhanced

### 1. Professional Modal Dialogs ✅
- **Measurement Modal**: Shows calculated values (distance/area) with label input
- **Annotation Modal**: Category selector with visual preview and label input
- **Edit Modal**: Allows editing label and deleting items

### 2. Clickable Items (To be implemented)
- Make all map overlays clickable to show edit modal
- Add event listeners to measurements, annotations, markers
- Enable double-click or right-click for editing

### 3. Better UX
- No more browser `prompt()` interruptions
- Visual feedback with modal dialogs
- Measurement values displayed before labeling
- Category preview in annotation modal
- Confirmation before deleting items

## Testing Steps

1. Navigate to `/sites/[id]/maps` page
2. Test measurement tools:
   - Click "Measure Distance" and draw a line
   - Modal should appear with calculated distance
   - Enter label and save
3. Test annotation tools:
   - Click "Marker" and place on map
   - Modal should appear with category selector
   - Select category, enter label, and save
4. Test editing:
   - Click on any placed item
   - Edit modal should appear
   - Change label or delete item

## Next Steps

1. Integrate the modal components into the main Site Maps page
2. Add click handlers to all overlays for editing
3. Test all functionality
4. Add keyboard shortcuts (ESC to close modals, Enter to save)
5. Add undo/redo support for edit operations

## Benefits

- ✅ Modern, professional UI
- ✅ Better user experience
- ✅ Live measurement calculations visible
- ✅ Edit/delete functionality for all items
- ✅ Category-based annotations
- ✅ No browser prompt() interruptions
- ✅ Responsive and accessible modals
