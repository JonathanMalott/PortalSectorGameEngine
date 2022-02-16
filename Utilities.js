
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

} 

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


//Map offset
var mapOffsetX = 10;
var mapOffsetY = 10;
var scaleX = 2;
var scaleY = 2;



//----------------------------------------------------------
// Move the current sector's floor or ceiling up/down
//----------------------------------------------------------
function ceilUp(){
		sectors[player.sector].ceil += 1;
		sectorRaw[player.sector][1] += 1;
}

function ceilDown(){
		sectors[player.sector].ceil -= 1
		sectorRaw[player.sector][1] -= 1;
}

function floorUp(){
		sectors[player.sector].floor += 1
		sectorRaw[player.sector][0] += 1;
}

function floorDown(){
		sectors[player.sector].floor -= 1
		sectorRaw[player.sector][0] -= 1;
}


//----------------------------------------------------------
// Delete the selected sector
//----------------------------------------------------------
function deleteSector(){
	
		if(selectedSector == 0) return;

		console.log("Deleting sector", selectedSector)

		//remove this sector
		sectorRaw.splice(selectedSector, 1)

		//Adjust all neighbors that are this sector to be -1, and neighbors > this sector to be one less 
		for(var i = 0; i < sectorRaw; i++)
			for(var k = (sectorRaw[i].length-2)/2+2; k < sectorRaw[i].length; k++){
				if(sectorRaw[i][k] == selectedSector) sectorRaw[i][k] == -1;
				if(sectorRaw[i][k] >  selectedSector) sectorRaw[i][k] -= 1;
			}

		//Reload the data
		LoadData();

}


// array of coordinates of each vertex of the polygon
//var polygon = [ [ 1, 1 ], [ 1, 2 ], [ 2, 2 ], [ 2, 1 ] ];
//inside([ 1.5, 1.5 ], polygon); // true
function inside(point, vs) {
    
    var x = point.x, y = point.y;
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        var xi = vs[i].x, yi = vs[i].y;
        var xj = vs[j].x, yj = vs[j].y;
        
        var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
};


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
       
    for(let line_y = start; line_y < end; line_y+=(1/scaleY))
    	drawMapPixel(mapOffsetX*scaleX+(in_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
    
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
        for(let line_x = start.x; line_x < end.x ; line_x+=(1/scaleX) ){
            //drawPixel(new point(line_x, line_y), color)
						drawMapPixel(mapOffsetX*scaleX+(line_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
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
    	for(let line_y = start.y; line_y < end.y ; line_y++ ){
     
            //drawPixel(new point(line_x, line_y), color)
			drawMapPixel(mapOffsetX*scaleX+(line_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
            error += slope
            if(error >= 0.5){
                line_x += dx_sign
                error -= 1
            }
        }
    }

}
