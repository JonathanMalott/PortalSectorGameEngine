

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

class xyz{
	constructor() {
		this.x = null;
		this.y = null;
		this.z = null
	}
} 

class xy{
	constructor(x,y) {
		this.x = x;
		this.y = y;
	}
} 

class sector {
  constructor() {
    this.floor = null;
    this.ceil = null;
    this.vertex = [];
    this.neighbors = new Array();
    this.npoints = null;
  }
} var sectors = [];

var NumSectors = 0;

/* Player: location */
class playerClass{

	constructor(x, y) {
    
	 	this.where = new xyz(); 
	 	this.velocity = new xyz();

	 	this.angle = null;
	 	this.anglesin = null;
	 	this.anglecos = null;
	 	this.yaw = null;

	 	this.sector = null;

	}

} var player = new playerClass();

// Utility functions.
const clamp = (a, mi, ma) => Math.min(Math.max(a, mi), ma);
const vxs = (x0,y0, x1,y1) => ((x0)*(y1) - (x1)*(y0));
const Overlap = (a0,a1,b0,b1) => (Math.min(a0,a1) <= Math.max(b0,b1) && Math.min(b0,b1) <= Math.max(a0,a1))
const IntersectBox = (x0,y0, x1,y1, x2,y2, x3,y3) => (Overlap(x0,x1,x2,x3) && Overlap(y0,y1,y2,y3))
const PointSide = (px,py, x0,y0, x1,y1) => vxs((x1)-(x0), (y1)-(y0), (px)-(x0), (py)-(y0))
const convertRange = ( value, r1, r2 ) => (( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ])
function Intersect(x1,y1, x2,y2, x3,y3, x4,y4){
	var out = new xy();
	out.x = vxs(vxs(x1,y1, x2,y2), (x1)-(x2), vxs(x3,y3, x4,y4), (x3)-(x4)) / vxs((x1)-(x2), (y1)-(y2), (x3)-(x4), (y3)-(y4));
	out.y = vxs(vxs(x1,y1, x2,y2), (y1)-(y2), vxs(x3,y3, x4,y4), (y3)-(y4)) / vxs((x1)-(x2), (y1)-(y2), (x3)-(x4), (y3)-(y4)); 
	return out;
}


//Vertex - y coordinate followed by list of x coordinates
vertexRaw = [[0,	 0, 6, 28],
			 [2,	 1, 17.5,],
			 [5,	 4, 6, 18, 21],
			 [6.5,	 9, 11,13,13.5,17.5],
			 [7,	 5, 7,8,9,11,13,13.5,15,17,19,21],
			 [7.5,   4, 6],
			 [10.5,  4, 6],
			 [11,    5, 7,8,9,11,13,13.5,15,17,19,21],
			 [11.5,  9, 11,13,13.5,17.5],
			 [13,4,  6, 18,21],
			 [16,    1, 17.5],
			 [18,    0, 6,28]];

//Sector (floor height, ceiling height, then vertex numbers in clockwise order)
//After the list of vertexes comes the list of sector numbers in the opposite side of that wall, -1 is none
sectorRaw = [
	[0,20	,3,14,29,49,-1,1,11,22],
	[0,20	,17,15,14,3,9,-1,12,11,0,21],
	[0,20	,41,42,43,44,50,49,40,-1,20,-1,3,-1,-1,22],
	[0,14	,12,13,44,43,35,20,-1,21,-1,2,-1,4],
	[0,12	,16,20,35,31,-1,-1,3,-1],
	[16,28	,24,8,2,53,48,39,18,-1,7,-1,6,-1],
	[16,28	,53,52,46,47,48,5,-1,8,10,-1],
	[16,28	,1,2,8,7,6,23,-1,5,-1,10],
	[16,36	,46,52,51,45,-1,6,-1,24],
	[16,36	,25,26,28,27,24,-1,10,-1],
	[16,26	,6,7,47,46,28,26,-1,7,-1,6,-1,9],
	[2,20	,14,15,30,29,0,1,12,22],
	[4,20	,15,17,32,30,11,1,13,22],
	[6,20	,17,18,33,32,12,-1,14,-1],
	[8,20	,18,19,34,33,13,19,15,20],
	[10,24	,19,21,36,34,14,-1,16,-1],
	[12,24	,21,22,37,36,15,-1,17,-1],
	[14,28	,22,23,38,37,16,-1,18,-1],
	[16,28	,23,24,39,38,17,-1,5,-1],
	[8,14	,10,11,19,18,1,21,-1,14],	
	[8,14	,33,34,42,41,1,14,-1,2],
	[0,20	,4,13,12,11,10,9,3,-1,-1,3,-1,19,-1,1],
	[0,20	,29,30,32,40,49,0,11,12,-1,2],
	[16,36	,1,6,5,0,-1,7,-1,24],
	[16,36	,0,5,25,27,45,51,-1,23,-1,9,-1,8]
];




//Vertex - y coordinate followed by list of x coordinates
vertexRaw = [[0,	 0, 15, 30],
			 [15,	 0, 15, 30],
			 [30,    0, 15]];

//Sector (floor height, ceiling height, then vertex numbers in clockwise order)
//After the list of vertexes comes the list of sector numbers in the opposite side of that wall, -1 is none
sectorRaw = [
	[0,15, 0,1,4,3, -1,2, 1,-1],
	[2,17, 3,4,7,6, 0,-1,-1,-1],
	[-1,30,1,2,5,4, -1,-1,-1,0]
];

function LoadData(){

	vertices = [];

	/* Initialize the vertices */
	for(var i = 0; i < vertexRaw.length; i++)
		for(var j = 1; j < vertexRaw[i].length; j++)
			vertices.push(new xy(vertexRaw[i][j],vertexRaw[i][0]))
		

	/* Initialize the sectors */
	for(var i = 0; i < sectorRaw.length; i++){

		var thisSector = sectorRaw[i];
		var newSector = new sector();
		newSector.floor = thisSector[0];
		newSector.ceil = thisSector[1];

		for(var j = 2; j < (thisSector.length-2)/2+2; j++) 
			newSector.vertex.push( vertices[  thisSector[j] ] );
		
		newSector.vertex.push( vertices[  thisSector[2] ] );

		for(var k = (thisSector.length-2)/2+2; k < thisSector.length; k++){
			newSector.neighbors.push( thisSector[k] );
			newSector.npoints++;
		}

		newSector.neighbors.push( thisSector[ (thisSector.length-2)/2+2] );
		newSector.npoints++;
		
		
	    //this.vertex = new xy();
	    //this.neighbors = null;
	    //this.npoints = null;
		sectors.push(newSector)

	}

	/* Initialize Player Data */
	player.sector = 0
	player.where.x = 2;
	player.where.y = 6;
	player.where.z = sectors[player.sector].floor + EyeHeight;
 	player.velocity.x = 0 ;
 	player.velocity.y = 0;
 	player.velocity.z = 0;
 	player.angle = 0
 	player.anglesin = 0
 	player.anglecos = 0
 	player.yaw = 0
 	
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
    for(var s = 0; s < sect.npoints-1; ++s){
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

function _DrawScreen(){



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
	for(var i = 0; i < MaxQueue; i++) queue.push(new item());

	/* Begin whole-screen rendering from where the player is. */
	queue[head] = { sectorno: player.sector, sx1: 0, sx2: W-1 };

	if(++head == MaxQueue) head = 0;

    while(head != tail){

	//console.log(head,tail)
		const now = queue[tail]; 
    
    	/* Pick a sector & slice from the queue to draw */
	    if(++tail == MaxQueue) tail = 0;
	    if(renderedsectors[now.sectorno] & 0x21) continue; // Odd = still rendering, 0x20 = give up
	    ++renderedsectors[now.sectorno];
	    const sect = sectors[now.sectorno];

		/* Render each wall of this sector that is facing towards player. */
		for(var s = 0; s < sect.npoints-1; ++s)
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

	        for(var x = beginx; x <= endx; ++x)
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
	        if(neighbor >= 0 && endx >= beginx && (head+MaxQueue+1-tail)%MaxQueue)
	        {        	
	            var a = new item( neighbor, beginx, endx );
	            queue[tail] = a;
	            if(++head == MaxQueue) head = 0;
	        }
	    } // for s in sector's edges
	    ++renderedsectors[now.sectorno];
	    //break;

    }
}


//---------------------------------------------------------------------
//	USER INPUT
//---------------------------------------------------------------------
if(true){
	document.onkeydown = checkKey;
	document.onkeyup = checkKey;
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
				player.angle += .1
				break;
			case 'ArrowLeft': 
				player.angle -= .1
				break;
			case 'ArrowUp': 
				player.yaw -= .1
				break;
			case 'ArrowDown': 
				player.yaw += .1
				break;
			case 'Space': 
				if(ground){
					player.velocity.z += 0.5;
					falling=1;
				}
				break;
		}

	};

	window.addEventListener('mousemove', draw, false);
	function draw(e) {
	    var pos = getMousePos(canvas, e);
	    this.mouseX = pos.x;
	    this.mouseY = pos.y;
	}

	function getMousePos(canvas, evt) {
	    var rect = canvas.getBoundingClientRect();
	    return {
	        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
	        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
	    };
	}
}


function DrawMap(){

	const scale = 2

	//Draw Grey Background and Grid Lines
	for(var x = 0; x < W; x++)
		for(var y = 0; y < H; y++){
			if(x % 10 == 0)
				drawMapPixel(x,y,[100,100,100]);
			else if(y % 10 == 0)
				drawMapPixel(x,y,[100,100,100]);
			else
				drawMapPixel(x,y,[80,80,80])
		}
	
	for(var i = 0; i < sectors.length; i++){
		var sector = sectors[i];

		for(var j = 0; j < sector.vertex.length-1; j++){
			var vertex = sector.vertex[j];
			var nvertex = sector.vertex[j+1];

			//Draw line between this vertex and next vertex

			//---------------------------------------------------------------------
			//	DRAW A VERTICAL LINE
			//---------------------------------------------------------------------   
			function drawVerticalLine(in_x, y_from, y_to, color){

				if(y_from == y_to){
					 //drawPixel(in_x, y_from, color)
					 drawMapPixel(W/2+in_x*scale,H/2+y_from*scale,color);
			         return
				}

				let start = y_from
			    let end = y_to
			        
			    if(y_from >= y_to){
			     	start = y_to
			     	end = y_from
			    }
			       
			    for(let line_y = start; line_y < end+1; line_y++)
			     	drawMapPixel(W/2+in_x*scale,H/2+line_y*scale,color);
			    
			}

			function drawLine(_start,_end,color){

				let start = Object.assign( {}, _start ); 
				let end = Object.assign( {}, _end ); 

				if(start.x == end.x){
					//draw vertical line
			        drawVerticalLine(start.x, start.y, end.y, color)
			        return
				}
			            

			    slope = Math.abs((end.y - start.y) / (end.x - start.x))
			    error = 0.0

			    if(slope < 1){

			        // 1. check in which octants we are & set init values
			       if(end.x < start.x){
			       		let a = start.x
			       		start.x = end.x
			       		end.x = a

			       		a = start.y
			       		start.y = end.y
			       		end.y = a

			        }
			            
			        line_y = start.y
			        dy_sign = -1
			        
			        if (start.y < end.y) 
			        	dy_sign = 1 

			   
			        // 2. step along x coordinate
			        for(let line_x = start.x; line_x < end.x + 1; line_x++ ){
			            //drawPixel(new point(line_x, line_y), color)
						drawMapPixel(W/2+line_x*scale,H/2+line_y*scale,color);
			            error += slope
			            if(error >= 0.5){
			                line_y += dy_sign
			                error -= 1
			            }
			        }
			    } else {

			        // Case of a rather vertical line

			        // 1. check in which octants we are & set init values
			        if(start.y > end.y){
			        	let a = start.x
			       		start.x = end.x
			       		end.x = a

			       		a = start.y
			       		start.y = end.y
			       		end.y = a
			        }

			        line_x = start.x

			        slope = 1 / slope
			        dx_sign = -1

			        if (start.x < end.x)
			        	dx_sign = 1 
			       

			        // 2. step along y coordinate
			    	for(let line_y = start.y; line_y < end.y + 1; line_y++ ){
			     
			            //drawPixel(new point(line_x, line_y), color)
						drawMapPixel(W/2+line_x*scale,H/2+line_y*scale,color)
			            error += slope
			            if(error >= 0.5){
			                line_x += dx_sign
			                error -= 1
			            }
			        }
			    }

			}

			if(sector.neighbors[j] > 0)
					drawLine(vertex,nvertex,[0,255,120]);
			else
				drawLine(vertex,nvertex,[255,0,0]);

			//Draw vertexes
			drawMapPixel(W/2+vertex.x*scale,H/2+vertex.y*scale,[0,255,50]);



		}
	}


	//Draw line of sight
	for(var i = 0; i < 10; i+=.5)
		drawMapPixel(W/2+(player.where.x+i*player.anglecos)*scale,H/2+(player.where.y+i*player.anglesin)*scale,[150,150,150]);


	//Draw Player, making it blink
	if(Date.now() % 800 > 400)
		drawMapPixel(W/2+player.where.x*scale,H/2+player.where.y*scale,[255,0,0]);
	else
		drawMapPixel(W/2+player.where.x*scale,H/2+player.where.y*scale,[200,200,200]);




	this.MapContext.putImageData(this.MapImage, 0, 0);
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

	let MapCanvas = document.querySelector('#map');
	this.MapContext = MapCanvas.getContext('2d',{ alpha: false });
	this.MapCanvas = MapCanvas;

	this.wsad = [0,0,0,0];
	this.ground=0;
	this.falling=1;
	this.moving=0;
	this.ducking=0;
	this.yaw = 0;

	this.mouseX = -1;
	this.mouseY = -1;

	this.image = context.createImageData(canvas.width, canvas.height);
	this.data = image.data;

	this.MapImage = context.createImageData(canvas.width, canvas.height);
	this.MapData = MapImage.data;

	window.requestAnimationFrame(this.gameLoop);

} main();



function postLoop(t0){
  this.context.putImageData(this.image, 0, 0);
  let t1 = performance.now()
  document.title = `FPS: ${Math.round(1000/(t1-t0)) }`
  window.requestAnimationFrame(gameLoop);
}


function gameLoop(timeStamp){
	let t0 = performance.now()

	//Update Screen Data
	document.querySelector('#CurrentSector').text = player.sector;
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

        /* Check if the player is about to cross one of the sector's edges */
        for(var s = 0; s < sect.npoints-1; ++s)
            if(IntersectBox(px,py, px+dx,py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) && PointSide(px+dx, py+dy, vert[s+0].x, vert[s+0].y, vert[s+1].x, vert[s+1].y) < 0)
            {
                /* Check where the hole is. */
                var hole_low  = sect.neighbors[s] < 0 ?  9e9 : Math.max(sect.floor, sectors[sect.neighbors[s]].floor);
                var hole_high = sect.neighbors[s] < 0 ? -9e9 : Math.min(sect.ceil,  sectors[sect.neighbors[s]].ceil );
                /* Check whether we're bumping into a wall. */
                if(hole_high < player.where.z+HeadMargin || hole_low  > player.where.z-eyeheight+KneeHeight)
                {
                    /* Bumps into a wall! Slide along the wall. */
                    /* This formula is from Wikipedia article "vector projection". */
                    var xd = vert[s+1].x - vert[s+0].x;
                    var yd = vert[s+1].y - vert[s+0].y;
                    var dx = xd * (dx*xd + yd*dy) / (xd*xd + yd*yd);
                    var dy = yd * (dx*xd + yd*dy) / (xd*xd + yd*yd);
                    moving = 0;
                }
            }
        MovePlayer(dx, dy);
        falling = 1;
    }

    /* mouse aiming */
    var rect = canvas.getBoundingClientRect();
    var x = this.mouseX;// - rect.left;
    var y = this.mouseY;// - rect.top;
	var change = convertRange(x,[0,W],[-1,1]);
	if(change < .1 && change > -.1) change = 0;
	player.angle += 0//change * 0.03;
    //yaw          = clamp(yaw - y*0.05, -5, 5);
    var change = convertRange(yaw - y*0.05,[0,H],[-1,1]);
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


	postLoop(t0);
}


