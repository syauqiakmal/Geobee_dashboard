import React, { useState, useEffect } from "react";
import logo from "../Logo/trash-bin.png";

import { createCustomIcon } from '../icons/customIcon';

import L from 'leaflet';

// Helper function to calculate color based on selected property
const calculateColor = (value, selectedProperty) => {
  let color = '#ff0000'; // Default to 'red'

  // Define ranges and colors for each property
  const ranges = {
    pengurangan_sampah: [
      { min: 50000, color: '#ffffe0' }, // Putih
      { min: 30000, color: '#ffff99' }, // Kuning pucat
      { min: 10000, color: '#ffcc00' }, // Kuning
      { min: 5000, color: '#ff9900' },  // Oranye
      { min: 0, color: '#ff0000' }       // Merah-oranye
    ],
    penanganan_sampah: [
      { min: 50000, color: '#ffffe0' }, // Putih
      { min: 40000, color: '#ffff99' }, // Kuning pucat
      { min: 30000, color: '#ffcc00' }, // Kuning
      { min: 20000, color: '#ff9900' }, // Oranye
      { min: 0, color: '#ff0000' }      // Merah-oranye
    ],
    jumlah_armada_truk: [
      { min: 20, color: '#ffffe0' }, // Putih
      { min: 15, color: '#ffff99' }, // Kuning pucat
      { min: 10, color: '#ffcc00' }, // Kuning
      { min: 0, color: '#ff0000' }   // Merah-oranye
    ],
    
    clustering: [
      { min: 2, color: '#ffcc00' }, // Oranye
      { min: 1, color: '#ff9900' }, // Kuning
      { min: 0, color: '#ff0000' }, // Merah
      
    ]
  };



  // Get the color range for the selected property
  const propertyRanges = ranges[selectedProperty] || [];
  console.log(`Selected Property: ${selectedProperty}`);
  console.log(`Value: ${value}`);
  console.log(`Property Ranges:`, propertyRanges);

  // Find the color based on the value
  for (const range of propertyRanges) {
    if (value >= range.min) {
      color = range.color;
      break;
    }
  }

  console.log(`Selected Color: ${color}`);
  return color;
};

// Function to get the style for each feature
export const getFeatureStyle = (feature, selectedProperty) => {
  let color = 'blue'; // Default to 'blue'

  const value = feature.properties[selectedProperty];
  
  console.log(`Value of ${selectedProperty}:`, value);

  if (value !== undefined) {
    color = calculateColor(value, selectedProperty);
  }

  return {
    color: '#000000',    // Black border color
    weight: 0.5,           // Thicker border
    fillColor: color,    // Fill color based on the `calculateColor` function
    fillOpacity: 0.5,   // Fill opacity
  };
};



const formatValue = (value) => {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return value;
};

export const onEachFeature = (feature, layer, uploadedFiles, selectedProperty) => {
  const fileIndex = uploadedFiles.findIndex(file =>
    file.data.features && file.data.features.some(f => f.properties === feature.properties)
  );

  console.log("File Index:", fileIndex);
  console.log("Uploaded Files:", uploadedFiles);

  if (fileIndex === -1) return;

  const selectedColumns = uploadedFiles[fileIndex]?.selectedColumns || [];
  let propertiesTable = '<table style="border-collapse: collapse; width: 100%;">';

  if (feature.properties) {
    for (let key in feature.properties) {
      if (selectedColumns.includes(key) && feature.properties[key] !== '' && feature.properties[key] !== '0' && key !== 'geom' && key !== 'id' && feature.properties[key] !== null) {
        const formattedValue = formatValue(feature.properties[key]);
        propertiesTable += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 5px; border: 1px solid #ddd;"><strong>${key}</strong></td>
            <td style="padding: 5px; border: 1px solid #ddd;">${formattedValue}</td>
          </tr>`;
      }
    }

    propertiesTable += '</table>';

    let popupContent = '<div>';
    if (propertiesTable !== '<table style="border-collapse: collapse; width: 100%;"></table>') {
      popupContent += '<h3>Table Data</h3>' + propertiesTable;
    }
    popupContent += '</div>';

    if (popupContent !== '<div></div>') {
      layer.bindPopup(popupContent);
    }
  }

  if (feature.geometry && feature.geometry.type === 'Point') {
    console.log("Nilai Lokasi:", feature.properties.Lokasi);
    if (feature.properties.Lokasi) {
      layer.setIcon(L.icon({
        iconUrl: logo,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      }));
    } else {
      layer.setIcon(createCustomIcon());
    }
  }

  layer.setStyle(getFeatureStyle(feature, selectedProperty)); // Set style based on selected property
};

export const PopupComponent = ({onTogglePopup, onToggleLegend, data, onSelectPropertyChange }) => {
  const [features, setFeatures] = useState([]);
  const [selectedProperties, setSelectedProperties] = useState({});
  const [selectedProperty, setSelectedProperty] = useState('penanganan_sampah'); // Default property


  const handleClick = () => {
    onTogglePopup();
    onToggleLegend();
  };
  useEffect(() => {
    if (data && data.features.length > 0) {
      setFeatures(data.features);
      const initialProperties = {};
      data.features.forEach((feature) => {
        Object.keys(feature.properties).forEach((key) => {
          if (key !== 'geom' && key !== 'kecamatan' && key !== 'id' && key !== 'tahun' && key !== 'kode_kecam') {
            initialProperties[key] = initialProperties[key] || false;
          }
        });
      });
      setSelectedProperties(initialProperties);
    } else {
      setFeatures([]);
      setSelectedProperties({});
    }
  }, [data]);

  const handlePropertyCheckboxChange = (property) => {
    setSelectedProperties(prev => ({
      ...prev,
      [property]: !prev[property],
    }));
  };

  const handleSelectChange = (event) => {
    const newSelectedProperty = event.target.value;
    setSelectedProperty(newSelectedProperty);
    onSelectPropertyChange(newSelectedProperty); // Notify parent of the change
  };

  const filteredFeatures = features.map((feature) => ({
    ...feature,
    properties: Object.entries(feature.properties)
      .filter(([key]) => key !== 'geom' && selectedProperties[key] !== false)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
  }));

  return (
    <>
      
     
      <div className="modal-container">
          <div className="dropdown-container">
      <label className="dropdown-label">
        <strong>Select Property for Analysis Color:</strong>
        <select className="dropdown-select" value={selectedProperty} onChange={handleSelectChange}>
          {Object.keys(selectedProperties).map((property) => (
            <option key={property} value={property} className="dropdown-option">
              {property}
            </option>
          ))}
        </select>
      </label>
    </div>
      <div className="checkbox-section">
      
      <div style={{ marginBottom: "20px" }}>
        <h4>Filter Properties</h4>
        {Object.keys(selectedProperties).map((property) => (
          <div key={property} className="checkbox-item">
            <label>
              <input
                type="checkbox"
                checked={selectedProperties[property]}
                onChange={() => handlePropertyCheckboxChange(property)}
              />
              <span className="indicator"></span>
              {property}
            </label>
          </div>
        ))}
      </div>
    </div>
    <h3>Table Data</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f2f2f2" }}>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Kecamatan</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Kode kecamatan</th>
                
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Tahun</th>
                <th style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((feature) => (
                <tr key={feature.properties.kecamatan} style={{ backgroundColor: "#fafafa" }}>
                  <td style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>
                    {feature.properties.kecamatan}
                  </td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>
                    {feature.properties.kode_kecam}
                  </td>
                  
                  <td style={{ padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" }}>
                    {feature.properties.tahun}
                  </td>
                  <td style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <tbody>
                        {Object.entries(feature.properties)
                          .filter(([key]) => key !== 'geom' && selectedProperties[key] !== false)
                          .map(([key, value], index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "white" }}>
                              <td style={{ padding: "5px", borderBottom: "1px solid #ddd" }}>{key}</td>
                              <td style={{ padding: "5px", borderBottom: "1px solid #ddd" }}>{value}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            onClick={handleClick}
            style={{
              position: "fixed",
              top: "160px",
              right: "50px",
              width: "30px",
              height: "30px",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            X
          </button>
        </div>
     
    </>
  );
};