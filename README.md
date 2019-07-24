# Sea Ice Animation Project
This site uses OpenLayers to load images from NSIDC's Geoserver of Sea Ice data. 
The site currently uses an expressjs server to load the page, but otherwise it is just the data in /public.
The main logic behind the project is in /public/script.js, and the page with the map is /public/index.html.

# Information about loading layers
Because OpenLayers is not designed to be actively loading layers frequently, which an animation needs, zooming or panning 
when loading layers would cause the layers to fail to load and have the map turn blank.
To avoid this, the program pre-loads 30 layers into the map. This means that for the first 30 frames, they are added
as quickly as possible but not displayed in the map. For later frames, the program displays the frame that is 30 frames ahead of the "current" frame, where the current frame is the one being loaded by the program. This means that OpenLayers does not have to deal with loading the frames at the same time as zooming or panning, which stops the issues with blank
maps. 
However, because of this, there are 30 frames left over after all dates have been cycled through. This is why, at the end of the program, the remaining frames are displayed in a while loop until all frames have been shown.
Still, the dates are also displayed in a similar way to the frames, so the displayed date is always displayed with the correct frame, not 30 layers off.
