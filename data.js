var APP_DATA = {
  "scenes": [
    {
      "id": "0-stich_with_sky_with_labels",
      "name": "Glacier Valley",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        },
        {
          "tileSize": 512,
          "size": 4096
        }
      ],
      "faceSize": 4096,
      "initialViewParameters": {
        "pitch": 0,
        "yaw": 0,
        "fov": 1.5707963267948966
      },
      "linkHotspots": [],
      "infoHotspots": [
        //{
        //  "yaw": -1.5,
        //  "pitch": 0.1,
        //  "title": "Info Hotspot Example",
        //  "text": "This is an info hotspot that opens a text modal."
        //}
      ],
      "imageHotspots": [
        {
        "yaw": 0.9,
        "pitch": -0.03,
        "image": "img/glacier_tongue.jpg",
        "scale": 1,
        "tilt": 80   // 0 = circle, 90 = flat line
        },

        {
        "yaw": 1.12,
        "pitch": 0.58,
        "image": "img/methane_uptake_stream.jpg",
        "scale": 0.8,
        "tilt": 50   // 0 = circle, 90 = flat line
        },

                {
        "yaw": -1.21,
        "pitch": 0.15,
        "image": "img/Wetland1.jpg",
        "scale": 0.2,
        "tilt": 60   // 0 = circle, 90 = flat line
        },

       {
        "yaw": -1.21,
        "pitch": 0.23,
        "image": "img/Wetland2.jpg",
        "scale": 0.3,
        "tilt": 60   // 0 = circle, 90 = flat line
        },

         {
        "yaw": -1.6,
        "pitch": 0.20,
        "image": "img/Glacier_lake1.jpg",
        "scale": 0.3,
        "tilt": 70   // 0 = circle, 90 = flat line
        },

        {
        "yaw": -1.68,
        "pitch": 0.25,
        "image": "img/wetland_and_lake.JPG",
        "scale": 0.3,
        "tilt": 70   // 0 = circle, 90 = flat line
        },

                {
        "yaw": -1.56,
        "pitch": 0.35,
        "image": "img/Glacier_lake2.JPG",
        "scale": 0.3,
        "tilt": 70   // 0 = circle, 90 = flat line
        }

        

      ]
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": false,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
