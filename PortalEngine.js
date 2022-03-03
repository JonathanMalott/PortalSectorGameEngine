

/* Define window size */
const W = 300;
const H = 200;
/* Define various vision related constants */
const EyeHeight = 6    // Camera height from floor when standing
const DuckHeight = 2.5  // And when crouching
const HeadMargin = 1    // How much room there is above camera before the head hits the ceiling
const KneeHeight = 2    // How tall obstacles the player can simply walk over without jumping
const hfov = (0.73*H)  // Affects the horizontal field of vision
const vfov = (.2*H)    // Affects the vertical field of vision
const scale = 2 // How much to scale up the map
var player = new playerClass();
var dt = 0

//Modes are GAME and EDITOR, ADDS
var mode = "GAME"

//VIEW, ADDSECTOR
var editorMode = "VIEW" 

/* Initialize Player Data */
player.sector = 0
player.where.x = 2;
player.where.y = 6;
player.velocity.x = 0 ;
player.velocity.y = 0;
player.velocity.z = 0;
player.angle = 0
player.anglesin = 0
player.anglecos = 0
player.yaw = 0

var temporaryVertex = [];
var selectedSector = 0;
mouseX = 0;
mouseY = 0;





function LoadData(){

	vertices = [];
	sectors = [];

	/* Initialize the vertices */
	for(var i = 0; i < vertexRaw.length; i++)
		vertices.push(new xy(vertexRaw[i][0],vertexRaw[i][1]))
			
	console.log("Reloading Level | Vertexes "+vertexRaw.length + " Sectors "+sectorRaw.length);

	/* Initialize the sectors */
	for(var i = 0; i < sectorRaw.length; i++){

		var thisSector = sectorRaw[i];
		var newSector = new sector();

		newSector.floor = thisSector[0];
		newSector.ceil = thisSector[1];

		for(var j = 2; j < (thisSector.length-2)/2+2; j++) 
			newSector.vertex.push( vertices[  thisSector[j] ] );
		
		newSector.vertex.push( vertices[ thisSector[2] ]);

		for(var k = (thisSector.length-2)/2+2; k < thisSector.length; k++){
			newSector.neighbors.push( thisSector[k] );
			newSector.npoints++;
		}

		newSector.neighbors.push( thisSector[ (thisSector.length-2)/2+2] );
		newSector.npoints++;
		
		sectors.push(newSector)
	}

	player.where.z = sectors[player.sector].floor + EyeHeight;

	
 	
}


function vline(x,y1,y2,top,middle,bottom)
{	

    y1 = clamp(parseInt(y1), 0, H-1);
    y2 = clamp(parseInt(y2), 0, H-1);

    if(y2 == y1)
    	drawPixel(x,y1,middle)
    else if(y2 > y1)
    {
    	drawPixel(x,y1,top)
        for(var y=y1+1; y<y2; ++y){
        	//pix[y*W+x] = middle;
        	drawPixel(x,y,middle)
        }

        drawPixel(x,y2,middle)
    }

}

/* MovePlayer(dx,dy): Moves the player by (dx,dy) in the map, and
 * also updates their anglesin/anglecos/sector properties properly.
 */
function MovePlayer(dx,dy)
{
	if(mode == "EDITOR" && editorMode == "ADDSECTOR") return;
	if(mode == "EDITOR" && editorMode == "DELETESECTOR") return;

    var px = player.where.x;
    var py = player.where.y;
    /* Check if this movement crosses one of this sector's edges
     * that have a neighboring sector on the other side.
     * Because the edge vertices of each sector are defined in
     * clockwise order, PointSide will always return -1 for a point
     * that is outside the sector and 0 or 1 for a point that is inside.
     */
    var sect = sectors[player.sector];
   	var vert = sect.vertex;


    for(var s = 0; s < vert.length-1; ++s){
    	//console.log(sect.neighbors[s],vert)
    	if(sect.neighbors[s] >= 0 && IntersectBox(px,py, px+dx,py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) && PointSide(px+dx, py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) < 0)
        {
            player.sector = sect.neighbors[s];
            break;
        }
    }
        

    player.where.x += dx;
    player.where.y += dy;
    player.anglesin = Math.sin(player.angle);
    player.anglecos = Math.cos(player.angle);

}


//---------------------------------------------------------------------
//	DRAW THE GAME SCREEN
//---------------------------------------------------------------------
function DrawScreen(){

	if(mode != "GAME") return;

	var MaxQueue = 32;

	var queue = [];
	var head = 0;
	var tail = 0;

	var ytop = [],  ybottom = [], renderedsectors = [];
	for(var i = 0; i < W; i++) ytop.push(0);
	for(var i = 0; i < W; i++) ybottom.push(H-1);
	for(var i = 0; i < sectorRaw.length; i++) renderedsectors.push(0);

	class item {
	  constructor(a,b,c) {
	  	this.sectorno = a;
	  	this.sx1 = b;
	  	this.sx2 = c; 
	  }
	}

	var queue = Array();
	//for(var i = 0; i < MaxQueue; i++) queue.push(new item());

	/* Begin whole-screen rendering from where the player is. */
	queue.push({ sectorno: player.sector, sx1: 0, sx2: W-1 });


    while(queue.length > 0 ){
		const now = queue[0]; 
		queue.shift();
    
    	/* Pick a sector & slice from the queue to draw */
	    //if(++tail == MaxQueue) tail = 0;
	    if(renderedsectors[now.sectorno] & 0x21) continue; // Odd = still rendering, 0x20 = give up
	    ++renderedsectors[now.sectorno];
	    const sect = sectors[now.sectorno];

		/* Render each wall of this sector that is facing towards player. */
		for(var s = 0; s < sect.vertex.length - 1; ++s)
		{
			/* Acquire the x,y coordinates of the two endpoints (vertices) of this edge of the sector */
	        var vx1 = sect.vertex[s+0].x - player.where.x;
	        var vy1 = sect.vertex[s+0].y - player.where.y;

	        var vx2 = sect.vertex[s+1].x - player.where.x;
	        var vy2 = sect.vertex[s+1].y - player.where.y;

	        /* Rotate them around the player's view */
	        var pcos = player.anglecos;
	        var psin = player.anglesin;
	        var tx1 = vx1 * psin - vy1 * pcos;
	        var tz1 = vx1 * pcos + vy1 * psin;
	        var tx2 = vx2 * psin - vy2 * pcos;
	        var tz2 = vx2 * pcos + vy2 * psin;

	        /* Is the wall at least partially in front of the player? */
	        if(tz1 <= 0 && tz2 <= 0) continue;

	        /* If it's partially behind the player, clip it against player's view frustrum */
	        if(tz1 <= 0 || tz2 <= 0)
	        {
	            var nearz = 1e-4;
	            var farz = 5;
	            var nearside = 1e-5;
	            var farside = 20;
	            // Find an intersection between the wall and the approximate edges of player's view
	            var i1 = Intersect(tx1,tz1,tx2,tz2, -nearside,nearz, -farside,farz);
	            var i2 = Intersect(tx1,tz1,tx2,tz2,  nearside,nearz,  farside,farz);
	            if(tz1 < nearz) { if(i1.y > 0) { tx1 = i1.x; tz1 = i1.y; } else { tx1 = i2.x; tz1 = i2.y; } }
	            if(tz2 < nearz) { if(i1.y > 0) { tx2 = i1.x; tz2 = i1.y; } else { tx2 = i2.x; tz2 = i2.y; } }
	        }

	        /* Do perspective transformation */
	        var xscale1 = hfov / tz1, yscale1 = vfov / tz1;
	        var x1 = W/2 - parseInt(tx1 * xscale1);
	        var xscale2 = hfov / tz2, yscale2 = vfov / tz2;
	        var x2 = W/2 - parseInt(tx2 * xscale2);

	        if(x1 >= x2 || x2 < now.sx1 || x1 > now.sx2) continue; // Only render if it's visible

	        /* Acquire the floor and ceiling heights, relative to where the player's view is */
	        var yceil  = sect.ceil  - player.where.z;
	        var yfloor = sect.floor - player.where.z;

	        /* Check the edge type. neighbor=-1 means wall, other=boundary between two sectors. */
	        var neighbor = sect.neighbors[s];
	        var nyceil=0, nyfloor=0;
	        if(neighbor >= 0) // Is another sector showing through this portal?
	        {
	            nyceil  = sectors[neighbor].ceil  - player.where.z;
	            nyfloor = sectors[neighbor].floor - player.where.z;
	        }

	        /* Project our ceiling & floor heights into screen coordinates (Y coordinate) */
	        const Yaw = (y,z) => (y + z*player.yaw)
	        var y1a  = H/2 - parseInt(Yaw(yceil, tz1) * yscale1);
	        var y1b = H/2 -  parseInt(Yaw(yfloor, tz1) * yscale1);
	        var y2a  = H/2 - parseInt(Yaw(yceil, tz2) * yscale2);
	        var y2b = H/2 -  parseInt(Yaw(yfloor, tz2) * yscale2);
	        
	        /* The same for the neighboring sector */
	        var ny1a = H/2 - parseInt(Yaw(nyceil, tz1) * yscale1);
	        var ny1b = H/2 - parseInt(Yaw(nyfloor, tz1) * yscale1);
	        var ny2a = H/2 - parseInt(Yaw(nyceil, tz2) * yscale2);
	        var ny2b = H/2 - parseInt(Yaw(nyfloor, tz2) * yscale2);

	        /* Render the wall. */
	        var beginx = Math.max(x1, now.sx1);
	        var endx = Math.min(x2, now.sx2);

	        //Step through the x coordinates for a wall
	        for(var x = beginx; x <= endx; x++)
	        {
	            /* Calculate the Z coordinate for this point. (Only used for lighting.) */
	            var z = ((x - x1) * (tz2-tz1) / (x2-x1) + tz1) * 8;
	            
	            /* Acquire the Y coordinates for our ceiling & floor for this X coordinate. Clamp them. */
	            var ya = (x - x1) * (y2a-y1a) / (x2-x1) + y1a;
	            var cya = clamp(ya, ytop[x],ybottom[x]); // top
	            var yb = (x - x1) * (y2b-y1b) / (x2-x1) + y1b;
	            var cyb = clamp(yb, ytop[x],ybottom[x]); // bottom

	            /* Render ceiling: everything above this sector's ceiling height. */
	            vline(x, ytop[x], cya-1, [17,17,17],[134,134,134],[17,17,17]);

	            /* Render floor: everything below this sector's floor height. */
	            vline(x, cyb+1, ybottom[x], [0,0,255],[0,0,170],[0,0,255]);

	            /* Is there another sector behind this edge? */
	            if(neighbor >= 0)
	            {

	            	//var r = [1*(255-parseInt(z)),1*(255-parseInt(z)),1*(255-parseInt(z))];
	                //vline(x, cya, cyb, 0, x==x1||x==x2 ? 0 : r, 0);

	                /* Same for _their_ floor and ceiling */
	                var nya = (x - x1) * (ny2a-ny1a) / (x2-x1) + ny1a;
	                var cnya = clamp(nya, ytop[x],ybottom[x]);
	                var nyb = (x - x1) * (ny2b-ny1b) / (x2-x1) + ny1b;
	                var cnyb = clamp(nyb, ytop[x],ybottom[x]);

	                /* If our ceiling is higher than their ceiling, render upper wall */
	            	//Grey 
	                var r1 = [1*(255-parseInt(z)),1*(255-parseInt(z)),1*(255-parseInt(z))];
	            	//Purple
	                var r2 = [4*parseInt(31- (parseInt(z)/8)) , 0 , 7*parseInt(31- (parseInt(z)/8))];
	  
	                vline(x, cya, cnya-1, 0, x==x1||x==x2 ? 0 : r1, 0); // Between our and their ceiling
	                ytop[x] = clamp(Math.max(cya, cnya), ytop[x], H-1);   // Shrink the remaining window below these ceilings
	                
	                /* If our floor is lower than their floor, render bottom wall */
	                vline(x, cnyb+1, cyb, 0, x==x1||x==x2 ? 0 : r2, 0); // Between their and our floor
	                ybottom[x] = clamp(Math.min(cyb, cnyb), 0, ybottom[x]); // Shrink the remaining window above these floors
	            } else {
	                /* There's no neighbor. Render wall from top (cya = ceiling level) to bottom (cyb = floor level). */
	                var r = [1*(255-parseInt(z)),1*(255-parseInt(z)),1*(255-parseInt(z))];
	                vline(x, cya, cyb, 0, x==x1||x==x2 ? 0 : r, 0);
	            }

	        }
			

	        /* Schedule the neighboring sector for rendering within the window formed by this wall. */
	        if(neighbor >= 0 && endx >= beginx )
	        {        	
	            var a = new item( neighbor, beginx, endx );
	            //queue[tail] = a;
	            //if(++head == MaxQueue) head = 0;
	            queue.push(a)
	        }
	        
	    } // for s in sector's edges
	    ++renderedsectors[now.sectorno];
	    
	    //if(queue.length)
	    //console.log(queue.length)
	    //break;

    }
}


//---------------------------------------------------------------------
//	USER INPUT
//---------------------------------------------------------------------
if(true){

	document.onkeydown = checkKey;
	document.onkeyup = checkKey;
	document.onclick = checkMouse;

	window.addEventListener('mousemove', draw, false);
	function draw(e) {
	    mouseX = getMousePos(canvas, e).x; mouseY = getMousePos(canvas, e).y;
	}

	function checkMouse(event){
	switch (event.which) {
	    case 1:
	      if(mode== "EDITOR" && editorMode=="ADDSECTOR"){
				mapAddVertex()
		  }else if(mode== "EDITOR" && editorMode=="DELETESECTOR"){
				sectorAddVertex()
		  }else if(mode== "EDITOR" && editorMode=="MOVEPLAYER"){
		  		var newX = Math.round(mouseX/5)*5;
				var newY = Math.round(mouseY/5)*5;
		
				player.where.x =  (newX-mapOffsetX)/scaleX-5;
				player.where.y =  (newY-mapOffsetY)/scaleY-5;

				player.sector = sectors.length-1;
				
				editorMode = "VIEW";
				mode = "GAME"
		  }
	      break;
	  }
	}

	function checkKey(event) {

		switch((event.code)){
		
			case 'KeyW': 
				wsad[0] = event.type=="keydown";
				break;
			case 'KeyA': 
				wsad[1] = event.type=="keydown"
				break;
			case 'KeyS': 
				wsad[2] = event.type=="keydown"
				break;
			case 'KeyD': 
				wsad[3] = event.type=="keydown"
				break;
			case 'ShiftLeft': 
			case 'ShiftRight': 
				ducking = event.type=="keydown"
				falling=1;
				break;
			case 'ArrowRight': 
				if(event.type=="keydown" && mode == "EDITOR" && editorMode == "DELETESECTOR"){
					if(selectedSector == sectors.length-1) selectedSector = 0;
					else selectedSector++;
					break;
				}
				player.angle += .1
				break;
			case 'ArrowLeft': 
				if(event.type=="keydown" && mode == "EDITOR" && editorMode == "DELETESECTOR"){
					if(selectedSector == 0) selectedSector = sectors.length-1;
					else selectedSector--;
					break;
				}
				player.angle -= .1
				break;
			case 'ArrowUp': 
				player.yaw -= .1
				break;
			case 'ArrowDown': 
				player.yaw += .1
				break;


			case "KeyP":
				console.log( sectors.length	 )
				break;


			case 'KeyE': 
				if(event.type=="keydown" && mode == "EDITOR")
					mode = "GAME"
				else if(event.type=="keydown" && mode == "GAME")
					mode = "EDITOR";
				break;
			case 'KeyG': 
				if(mode == "EDITOR"){
					if(event.type=="keydown" && editorMode == "VIEW")
						editorMode = "ADDSECTOR"
					else if(event.type=="keydown" && editorMode == "ADDSECTOR")
						editorMode = "VIEW";
				}
				break;
			case 'KeyB': 
				if(mode == "EDITOR"){
					if(event.type=="keydown" && editorMode == "VIEW")
						editorMode = "DELETESECTOR"
					else if(event.type=="keydown" && editorMode == "DELETESECTOR")
						editorMode = "VIEW";
				}
				break;

			case 'KeyM': 
				if(mode == "EDITOR"){
					if(event.type=="keydown" && editorMode == "VIEW")
						editorMode = "MOVEPLAYER"
					else if(event.type=="keydown" && editorMode == "MOVEPLAYER")
						editorMode = "VIEW";
				}
				break;


			case 'KeyP': 
				if(event.type=="keydown")
					player.sector += 1;

			case 'KeyL': 
				if(event.type=="keydown")
					player.sector -= 1;
						
				
				break;


			case 'Space': 
				if(ground){
					player.velocity.z += 0.5;
					falling=1;
				}
				break;
		}

	};



	function getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    return {
	        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
	        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	    };
	}
}


//-------------------------------------------------------------------
// Add a vertex to an existing sector
//-------------------------------------------------------------------
function sectorAddVertex(){

	var newX = Math.round(mouseX/5)*5;
	var newY = Math.round(mouseY/5)*5;
	var newPoint = new xy(  (newX-mapOffsetX)/scaleX-5  ,  (newY-mapOffsetY)/scaleY-5  );
	
	//First, make sure the user clicked somewhere on the current sector
	for(var i = 0; i < sectors[selectedSector].vertex.length -1; i++){
		var thisPoint = sectors[selectedSector].vertex[i];
		var nextPoint = sectors[selectedSector].vertex[i+1];

		//Can't add new vertex on top of existing vertex
		if(pointsEqual(thisPoint,newPoint) || pointsEqual(nextPoint,newPoint) ) continue;

		//Check if the newPoint is between two adjacent points
		if( isBetween(thisPoint,nextPoint,newPoint) ){


			//Can't add new vertex wall is a portal
			if( sectors[selectedSector].neighbors[i] >= 0 ) {
				alert("You can only add new vertexes to solid walls");
				break;
			}
			
			//Add vertex to vertex list
			vertexRaw.push([newPoint.x,newPoint.y]);
			sectorRaw[selectedSector].splice(2+i+1, 0, vertexRaw.length-1 );

			//Add Neighbor
			sectorRaw[selectedSector].splice(2+i+sectors[selectedSector].vertex.length, 0, -1 );

			LoadData();

			return;

		}

	}

}


//-------------------------------------------------------------------
// Allows the user to add more sectors to the map
//-------------------------------------------------------------------
function mapAddVertex(){

	//Detect where user clicked on the map and round it to the nearest 5
	var newX = Math.round(mouseX/5)*5;
	var newY = Math.round(mouseY/5)*5;
	var newPoint = new xy(  (newX-mapOffsetX)/scaleX-5  ,  (newY-mapOffsetY)/scaleY-5  );

	var notInMiddleOfWall = true;
	// If the newPoint is located on an existing sector wall, it MUST be on a vertex.
	for(var s = 0; s < sectors.length; s++)
		for(var i = 0; i < sectors[s].vertex.length -1; i++){
			var thisPoint = sectors[s].vertex[i];
			var nextPoint = sectors[s].vertex[i+1];

			

			//Check if the newPoint is between two adjacent points
			if( isBetween(thisPoint,nextPoint,newPoint) ) 
				if(!pointsEqual(thisPoint,newPoint) && !pointsEqual(nextPoint,newPoint) ) notInMiddleOfWall = false;

		
		}

	//if(!notInMiddleOfWall) {
	//	alert("you must use the vertexes on a wall")
	//	return;
	//}


	//When the user clicks on the first point again, close the sector
	if(temporaryVertex.length > 2 && temporaryVertex[0].x == newPoint.x && temporaryVertex[0].y == newPoint.y){

		//arrange vertexes into clockwise winding
		temporaryVertex = orderVertex();

		//only continue if the vertex are convex
		if(sectorIsConvex() == false){
			alert("All sectors must be convex. Break up concave sectors into several convex ones.")
			temporaryVertex = [];
			return;
		}
		
		//Containers to hold vertexes and neighbors
		var vid = [];
		var neighbor = [];

		//vid.append()

		//Loop through temporary vertexes and add them to the container
		for(var t = 0; t < temporaryVertex.length; t++){
			vertexRaw.push([temporaryVertex[t].x,temporaryVertex[t].y])
			vid.push(vertexRaw.length-1)
		}

		vid = [vid[vid.length-1], ...vid];


		//vid.push(vertexRaw.length-vid.length)


		newSectorFloor = 0;
		newSectorCeil = 15;


		//Find the neighbor of the new sector, if any
		for(var i = 0; i < vid.length-1; i++){

			var p11 = new xy(vertexRaw[vid[i]][0],vertexRaw[vid[i]][1] );
			var p12 = new xy(vertexRaw[vid[i+1]][0], vertexRaw[vid[i+1]][1] );


			var hasNeighbor = false;

			//Loop through each wall in each sector and determine if it overlaps the current wall. If it does, we should make it a neighbor.
			for(var j = 0; j < sectors.length; j++){
				for(var k = 0; k < sectors[j].vertex.length-1; k++){


					
					var p21 = sectors[j].vertex[k];
					var p22 = sectors[j].vertex[k+1]; 


					if( (pointsEqual(p11,p21) && pointsEqual(p12,p22)) || ((pointsEqual(p12,p21) && pointsEqual(p11,p22))) ){

						console.log("|-")

						neighbor.push(j)
						hasNeighbor = true;

						//Change other wall to make the new sector its neighbor
						sectorRaw[j][2+sectors[j].vertex.length+k-1] = sectorRaw.length;

						newSectorFloor = sectorRaw[j][0];
						newSectorCeil = sectorRaw[j][1];

						break;

					}
				}
			}

			 	
			//No neighbor was found, make it a solid wall
			if(hasNeighbor == false) neighbor.push(-1)
			
		}


		console.log("A NEW SECTOR IS ADDED----")
		console.log(neighbor);
		console.log("---")

		neighbor.push(-1);

		//Add new sector, make the floor and ceiling the same as the sector it is connected to
		sectorRaw.push([ newSectorFloor,newSectorCeil, ...vid , ...neighbor ]);

		//reset temporary vertex array
		temporaryVertex = [];

		//Leave editor mode
		editorMode = "VIEW";

		//Reload data to update map
		LoadData();

		return;

	}

	//The user hasn't closed off the sector yet, keep adding them to temporary vertex array. Remove duplicates in case the user clicks on same point twice. 
	temporaryVertex.push( newPoint );
	temporaryVertex = [...new Set(temporaryVertex)];
	
}


function saveLevel(){
	console.log(sectorRaw);
	console.log(vertexRaw);
}


function DrawMap(){

	if(mode != "EDITOR") return;
	

	//Draw Grey Background and Grid Lines
	for(let x = 0; x < W; x++)
		for(let y = 0; y < H; y++){
			if(x % 10 == 0)
				drawMapPixel(x,y,[60,60,60]);
			else if(y % 10 == 0)
				drawMapPixel(x,y,[60,60,60]);
			else if(editorMode == "VIEW")
				drawMapPixel(x,y,[50,50,50])
			else if(editorMode == "ADDSECTOR")
				drawMapPixel(x,y,[55,35,35])
			else if(editorMode == "DELETESECTOR")
				drawMapPixel(x,y,[35,55,35])
			else if(editorMode == "MOVEPLAYER")
				drawMapPixel(x,y,[35,35,55])

			if(x % 100 == 0)
				drawMapPixel(x,y,[80,80,80]);
			else if(y % 100 == 0)
				drawMapPixel(x,y,[80,80,80]);
			
		}


	//Draw Sector Borders
	for(var i = 0; i < sectors.length; i++)
		for(var j = 0; j < sectors[i].vertex.length-1; j++){

			var vertex = sectors[i].vertex[j];
			var nvertex = sectors[i].vertex[j+1];

			var color1 = [120,130,130];
			var color2 = [0,255,0];

			if(editorMode == "DELETESECTOR" && selectedSector == i){
				color1 = (Date.now() % 900 > 450)?[0,0,0]:[120,130,130];
				color2 = (Date.now() % 800 > 450)?[0,255,0]:[120,255,200];
			}

			//Draw line between this vertex and next vertex
			if(sectors[i].neighbors[j] < 0)
				drawLine(vertex,nvertex,color1);
			else
				drawLine(vertex,nvertex,color2);
		
		}
	



	//Draw Vertexes
	for(var i = 0; i < sectors.length; i++){
		var sector = sectors[i];

		for(var j = 0; j < sector.vertex.length-1; j++){
			var vertex = sector.vertex[j];
			var nvertex = sector.vertex[j+1];

			try {
			  //Draw vertexes
				drawMapPixel( scaleX*(nvertex.x+mapOffsetX) , scaleY*(nvertex.y+mapOffsetY),[255,0,0]);
			}
			catch(err) {
			   console.log('--------')
			}
			

		}
	}


	//Draw Temporary Vertexes
	for(var i = 0; i < temporaryVertex.length; i++){
		var blinky = (Date.now() % 400 > 200)?[255,0,0]:[200,200,200];
		if(i == 0) blinky = (Date.now() % 200 > 100)?[255,0,0]:[200,200,200];
		drawMapPixel(scaleX*(temporaryVertex[i].x+mapOffsetX),scaleY*(temporaryVertex[i].y+mapOffsetY) ,blinky);
	}


	//Draw line of sight
	for(var i = 0; i < 5; i+=.5)
		drawMapPixel( scaleY*(mapOffsetX+player.where.x+i*player.anglecos) , scaleY*(mapOffsetY+player.where.y+i*player.anglesin),[150,150,150]);

	//Draw Player, making it blink
	var blinky = (Date.now() % 800 > 400)?[255,0,0]:[200,200,200];
	drawMapPixel(scaleX*(player.where.x+mapOffsetX),scaleY*(player.where.y+mapOffsetY) ,blinky);

	if(mode == "EDITOR")
		this.context.putImageData(this.MapImage, 0, 0);

}

//---------------------------------------------------------------------
//	PLOT A SIGLE POINT OF A GIVEN COLOR
//---------------------------------------------------------------------   
function drawPixel(x,y, color) {
  	var roundedX = Math.round(x);
  	var roundedY = Math.round(y);
  	var index = 4 * (canvas.width * roundedY + roundedX);
  	data[index + 0] = color[0]; data[index + 1] = color[1];
    data[index + 2] = color[2]; data[index + 3] = 255;
}

function drawMapPixel(x,y, color) {
  	var roundedX = Math.round(x);
  	var roundedY = Math.round(y);
  	var index = 4 * (canvas.width * roundedY + roundedX);
  	MapData[index + 0] = color[0]; MapData[index + 1] = color[1];
    MapData[index + 2] = color[2]; MapData[index + 3] = 255;
}


//---------------------------------------------------------------------
//	Define Maain Variables
//--------------------------------------------------------------------- 
function main(){

	LoadData();

	let canvas = document.querySelector('#pixelGame');
	this.context = canvas.getContext('2d',{ alpha: false });
	this.canvas = canvas;

	this.wsad = [0,0,0,0];
	this.ground=0;
	this.falling=1;
	this.moving=0;
	this.ducking=0;
	this.yaw = 0;

	mouseX = -1;
	mouseY = -1;

	this.image = context.createImageData(canvas.width, canvas.height);
	this.data = image.data;

	this.MapImage = context.createImageData(canvas.width, canvas.height);
	this.MapData = MapImage.data;

	window.requestAnimationFrame(this.gameLoop);

} main();



function postLoop(){


  if(mode == "GAME")
  	this.context.putImageData(this.image, 0, 0);
  else
  	this.context.putImageData(this.MapImage, 0, 0);

  //let t1 = performance.now()

  document.title = `FPS: ${Math.round(1000/(dt)*10)/10 }`
 
  window.requestAnimationFrame(gameLoop);
}


var lastTime = 0;

function gameLoop(timeStamp){

    dt = (timeStamp-lastTime) ;

	lastTime = timeStamp;

	//Update Screen Data
	document.querySelector('#CurrentSector').text = player.sector;
	document.querySelector('#CurrentFloor').text = sectors[player.sector].floor;
	document.querySelector('#CurrentCeil').text = sectors[player.sector].ceil;
	document.querySelector('#CurrentPosition').text = Math.round(player.where.x*10)/10 + " " + Math.round(player.where.y*10)/10 + " " + Math.round(player.where.z*10)/10 ;
	document.querySelector('#CurrentYaw').text = Math.round(player.yaw*100)/100;
	document.querySelector('#CurrentAngle').text = Math.round(player.angle*100)/100;

	DrawScreen();

	DrawMap();

	/* Vertical collision detection */
    var eyeheight = ducking ? DuckHeight : EyeHeight;
    ground = !falling;

    /* Vertical collision detection */
    if(falling)
    {
        player.velocity.z -= 0.05; /* Add gravity */
        var nextz = player.where.z + player.velocity.z;
        if(player.velocity.z < 0 && nextz  < sectors[player.sector].floor + eyeheight) // When going down
        {
            /* Fix to ground */
            player.where.z    = sectors[player.sector].floor + eyeheight;
            player.velocity.z = 0;
            falling = 0;
            ground  = 1;
        }
        else if(player.velocity.z > 0 && nextz > sectors[player.sector].ceil) // When going up
        {
            /* Prevent jumping above ceiling */
            player.velocity.z = 0;
            falling = 1;
        }
        if(falling)
        {
            player.where.z += player.velocity.z;
            moving = 1;
        }
    }

    /* Horizontal collision detection */
    if(moving)
    {
        var px = player.where.x;
        var py = player.where.y;
        var dx = player.velocity.x;
        var dy = player.velocity.y;

        const sect = sectors[player.sector];
        const vert = sect.vertex;
        vert.push(vert[0])


        /* Check if the player is about to cross one of the sector's edges */
        for(var s = 0; s < vert.length-1; ++s) 
            if(IntersectBox(px,py, px+dx,py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) && PointSide(px+dx, py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) < 0)
            {
                /* Check where the hole is. */
                var hole_low  = sect.neighbors[s] < 0 ?  9e9 : Math.max(sect.floor, sectors[sect.neighbors[s]].floor);
                var hole_high = sect.neighbors[s] < 0 ? -9e9 : Math.min(sect.ceil,  sectors[sect.neighbors[s]].ceil );
                /* Check whether we're bumping into a wall. */
                if(hole_high < player.where.z+HeadMargin || hole_low  > player.where.z-eyeheight+KneeHeight)
                {
                    /* Bumps into a wall! Slide along the wall. */
                    var p = new xy(dx,dy);
                    //var n = new xy(-.371,-.928);
                    var n = getNormal(vert[s+0],vert[s+1],p)

                    var slide = vectorSubtractVector( p  , vectorMultiplyScalar(n, dot(p,n)) );

                    moving = 0;
                    dy = slide.y;
                    dx = slide.x;

                }
            }
        MovePlayer(dx * dt*.05, dy * dt*.05);
        falling = 1;
    }

    /* mouse aiming */
    //var rect = canvas.getBoundingClientRect();
    //var x = mouseX;// - rect.left;
    //var y = mouseY;// - rect.top;
	//var change = convertRange(x,[0,W],[-1,1]);
	//if(change < .1 && change > -.1) change = 0;
	//player.angle += 0//change * 0.03;
    //yaw          = clamp(yaw - y*0.05, -5, 5);
    //var change = convertRange(yaw - y*0.05,[0,H],[-1,1]);
    //player.yaw   =  0//change - player.velocity.z*0.01;
    MovePlayer(0,0);

	var move_vec = [0,0];
	if(wsad[0]) { move_vec[0] += player.anglecos*0.2; move_vec[1] += player.anglesin*0.2; }
	if(wsad[2]) { move_vec[0] -= player.anglecos*0.2; move_vec[1] -= player.anglesin*0.2; }
	if(wsad[1]) { move_vec[0] += player.anglesin*0.2; move_vec[1] -= player.anglecos*0.2; }
	if(wsad[3]) { move_vec[0] -= player.anglesin*0.2; move_vec[1] += player.anglecos*0.2; }
	var pushing = wsad[0] || wsad[1] || wsad[2] || wsad[3];
	var acceleration = pushing ? 0.4 : 0.2;

	player.velocity.x = player.velocity.x * (1-acceleration) + move_vec[0] * acceleration;
	player.velocity.y = player.velocity.y * (1-acceleration) + move_vec[1] * acceleration;

	if(pushing) moving = 1;

	postLoop();

}


