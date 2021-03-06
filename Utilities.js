
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

function getNormal(p1,p2,playerPoint){

	//p1 = (a,b) and p2 = (c,d) define the line segment
	//PlayerPoint = (p,q) be the other point.
	var a = p1.x, b = p1.y, c = p2.x, d = p2.y;
	var v = new xy( c-a, d-b); //defines the direction along the line segment. Its perpendicular is:
	var u = new xy(d-b,a-c);//This can be seen by taking the dot product with v. To get the normal from the perpendicular, just divide by its length:
	var n = vectorNormalize( u )

	//We now just need to know where P lies relative to the normal. If we take
	var dir = dot( vectorSubtractVector(playerPoint,p1), n) 

	//Then dir > 0 means n is in the same direction as P, 
	//whilst dir < 0 means it is in the opposite direction. 
	//Should dir == 0, then P is in fact on the extended line (not necessarily the line segment itself).

	return n
}

function vectorNormalize(v){
	var poppop = Math.sqrt(v.x*v.x + v.y*v.y);
	return new xy( v.x/poppop, v.y/poppop );
}

function vectorSubtractVector(v1,v2){
	return new xy( v1.x-v2.x, v1.y-v2.y );
}

function dot(v1,v2){
	return  v1.x*v2.x + v1.y*v2.y ;
}

function vectorMultiplyScalar(vector,scalar){
	return new xy( vector.x*scalar, vector.y*scalar );
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


function pointsEqual(p1,p2){
	return (p1.x == p2.x && p1.y == p2.y);
}

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
// Determine if the sector the user wants to create is convex
//----------------------------------------------------------
function findAngle(A,B,C) {
		//B is the center point
    var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
    var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
    var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
    return Math.round(Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB)) * 180 / Math.PI );
}

function sectorIsConvex(){

	let points =  temporaryVertex; 
  var total = 0;

	for(let p = 0; p < points.length; p++){
		let thisPoint = points[p];
		let lastPoint = (p>0)?points[p-1]:points[points.length-1];
		let nextPoint = (p<points.length-1)?points[p+1]:points[0];
		total += 180 - findAngle(lastPoint,thisPoint,nextPoint);
	}

	return (total == 360);
}


//----------------------------------------------------------
// Order vertexes of new sector into clockwise order
//----------------------------------------------------------
function orderVertex(){

	var totalX = 0, totalY = 0;

	for(var i = 0; i < temporaryVertex.length; i++){
		totalX+= temporaryVertex[i].x;
		totalY+= temporaryVertex[i].y;
	}

	var centerPoint = new xy(totalX/temporaryVertex.length, totalY/temporaryVertex.length)

	/*temporaryVertex.sort(function(a, b) {
	  var angle1 = Math.atan( (a.y-centerPoint.y) - (a.x-centerPoint.x) )
	  var angle2 = Math.atan( (b.y-centerPoint.y) - (b.x-centerPoint.x) )
	  console.log(angle1,angle2)
	  return angle1 - angle2;
	});*/

	return temporaryVertex;


}


function isBetween(a, b, c){

    crossproduct = (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y)

    // compare versus epsilon for floating point values, or != 0 if using integers
    if(Math.abs(crossproduct) > 0)
        return false

    dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y)*(b.y - a.y)
    if(dotproduct < 0)
        return false

    squaredlengthba = (b.x - a.x)*(b.x - a.x) + (b.y - a.y)*(b.y - a.y)
    if(dotproduct > squaredlengthba)
        return false

    return true
}


//----------------------------------------------------------
// Delete the selected sector
//----------------------------------------------------------
function deleteSector(){

		if(selectedSector == 0 || selectedSector == player.sector) return;

		console.log("Deleting sector", selectedSector)

		//remove this sector
		sectorRaw.splice(selectedSector, 1)

		//Adjust all neighbors that are this sector to be -1, and neighbors > this sector to be one less 
		for(var i = 0; i < sectorRaw.length; i++)
			for(var k = (sectorRaw[i].length-2)/2+2; k < sectorRaw[i].length; k++){
				if(sectorRaw[i][k] == selectedSector) sectorRaw[i][k] = -1;
				if(sectorRaw[i][k] >  selectedSector) sectorRaw[i][k] -= 1;
			}


		if(selectedSector < player.sector) player.sector -= 1;

		//Reload the data
		editorMode = "VIEW";
		selectedSector = 0;
		LoadData();

}


// array of coordinates of each vertex of the polygon
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

	let start = y_from
    let end = y_to
        
    if(y_from >= y_to){
     	start = y_to
     	end = y_from
    }
       
    for(let line_y = start; line_y < end; line_y+=(1/scaleY))
    	drawMapPixel(mapOffsetX*scaleX+(in_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
    
}


//-------------------------------------------- -------------------------
//	DRAW A LINE BETWEEN TWO POINTS ON THE MAP
//---------------------------------------------------------------------   
function drawLine(_start,_end,color){

	let start = Object.assign( {}, _start ); 
	let end = Object.assign( {}, _end ); 

	if(start.x == end.x){
        drawVerticalLine(start.x, start.y, end.y, color)
        return;
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
        
        if (start.y < end.y) dy_sign = 1 
   
        // 2. step along x coordinate
        for(let line_x = start.x; line_x < end.x ; line_x+=1/scaleX ){
						drawMapPixel(mapOffsetX*scaleX+(line_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
            error += slope
            if(error >= 0.5){
                line_y += dy_sign/scaleY
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
    	for(let line_y = start.y; line_y < end.y ; line_y+=1/scaleY ){
     
            //drawPixel(new point(line_x, line_y), color)
			drawMapPixel(mapOffsetX*scaleX+(line_x*scaleX),mapOffsetY*scaleY+(line_y*scaleY),color);
            error += slope
            if(error >= 0.5){
                line_x += dx_sign/scaleX
                error -= 1
            }
        }
    }

}
