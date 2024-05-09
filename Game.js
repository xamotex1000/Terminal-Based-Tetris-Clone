//#region Initialization
const EventEmmiter = require('events');
const emmiter = new EventEmmiter();
const readline = require("readline");
const keypress = require("keypress");
const fs = require("fs");
var TP = [];
var TH = [];
var TS = [];
var Rotation;
var piece;
var pieceState;
var Dropping = false;
var softDropSpeed;
var holdPiece;
var nextPiece;

//enable developer mode
var debug = false;

emmiter.on("error", function(event){
	console.error("ArrayStatus: ", boardPosition);
});
const pieceShapeFile = fs.readFileSync('pieceShapes.json', 'utf-8');
const pieceShapeArray = JSON.parse(pieceShapeFile);
function attachPieceShapes(pieceShape){
	let fullShape = pieceShape[0]+pieceShape[1]+pieceShape[2]+pieceShape[3];
	return(fullShape);
}
var pieceShapes = [];
pieceShapeArray.forEach(item => {
	pieceShapes.push(attachPieceShapes(item.Format));
});
nextPiece = Math.floor(Math.random()*pieceShapes.length);
var boardPosition = [
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000",
	"0000000000"
];
var nextShape = pieceShapes[nextPiece];
//#endregion
//#region Environment Control
var Backdrop = [];
var BckgrClr = "\x1b[47m";
for(var i = 0; i < 24; i++){
	Backdrop.push();
	Backdrop[i] = BckgrClr + "                                                  " + "\x1b[0m";
	process.stdout.write(Backdrop[i] + "\n");
}
newPiece();
setInterval(tick, 1000);
//#endregion
//#region Board Control
function InsertAt(x, y){
	var modified = boardPosition[y].substring(0, x) + 1 + boardPosition[y].substring(x+1, boardPosition[y].length);
	boardPosition.splice(y, 1, modified)
	reloadBoard();
}
function RemoveAt(x, y){
	var modified = boardPosition[y].substring(0, x) + 0 + boardPosition[y].substring(x+1, boardPosition[y].length)
	boardPosition.splice(y, 1, modified);
	reloadBoard();
}
function SolidifyAt(x, y){
	var modified = boardPosition[y].substring(0, x) + 2 + boardPosition[y].substring(x+1, boardPosition[y].length)
	boardPosition.splice(y, 1, modified)
	reloadBoard();
}
function ClearLines() {
	var clearedLines = [];
	boardPosition.forEach(function(element, index, array){
		if(element === "2222222222"){
			clearedLines.push(index);
		}
	});
	clearedLines.forEach(function(element, index, array){
		boardPosition.splice(element, 1);
		boardPosition.unshift("0000000000");
	});
	reloadBoard();
}
function reloadBoard() {
	var product = [];
	for(var i = 0; i < 20; i++){
		product.push("");
	}
	for(var i = 0; i < 4; i++){
		if(debug){
			var visual = (nextShape[i*4]+nextShape[i*4+1]+nextShape[i*4+2]+nextShape[i*4+3]).replace(/0/g, "\x1b[0m" + "0 " + "\x1b[0m");
			visual = visual.replace(/1/g, "\x1b[44m" + "1 " + "\x1b[0m");
			visual = visual.replace(/2/g, "\x1b[44m" + "2 " + "\x1b[0m");
		} else{
			var visual = (nextShape[i*4]+nextShape[i*4+1]+nextShape[i*4+2]+nextShape[i*4+3]).replace(/0/g, "  ");
			visual = visual.replace(/1/g, "\x1b[44m" + "[]" + "\x1b[0m");
			visual = visual.replace(/2/g, "\x1b[44m" + "[]" + "\x1b[0m");
		}
		product[i+2] += " " + visual;
	}
	for(var i = 0; i < boardPosition.length; i++){
		if(debug){
        		var visual = boardPosition[i].replace(/0/g, "\x1b[40m0 \x1b[0m");
			visual = visual.replace(/1/g, "\x1b[44m1 \x1b[0m");
			visual = visual.replace(/2/g, "\x1b[44m2 \x1b[0m");
		} else{
			var visual = boardPosition[i].replace(/0/g, "\x1b[40m()\x1b[0m");
			visual = visual.replace(/1/g, "\x1b[44m[]\x1b[0m");
        		visual = visual.replace(/2/g, "\x1b[44m[]\x1b[0m");
		}
		var lines = 22-i;
        	process.stdout.write("\x1b[" + lines + "A\r\x1b[15C" + visual + "\x1b[5C" + product[i] + "\x1b[0m" + "\x1b[" + lines + "B");
	}
}

//#endregion
//#region Input Handler
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});
keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("keypress", (ch, key) => {
	if(key) {
		if(key.name === 'w'){
			while(!validityCheck("H")){
				moveDown()
			}
		} else if(key.name === 's') {
			if(!validityCheck("H")) {
				moveDown()
			}
		} else if(key.name === 'a') {
			move(-1);
		} else if(key.name === 'd') {
			move(1);
		} else if(key.name === 'e') {
			rotate(1);
		} else if(key.name === 'q') {
			rotate(-1)
		} else if(key.ctrl){
		}
	}
	process.value = "";
	reloadBoard();
});
function ifArray(arr1, arr2, func){
	for(var i = 0; i < arr1.length; i++){
		var seg = eval(func + "(" + arr1[i] + ", " + arr2[i] + ")");
		if(!seg){
			return(false);
		}
	}
	return(true);
}
//#endregion
//#region Piece Movement
function rotate(direction) {
	if(!Rotation){
		return;
	}
	var TI = [];
	var TPL = [];
	var THL = [];
	for(var i = 0; i < TP.length-1; i++){
		TI[i] = [TP[i+1]-TP[0], TH[i+1]-TH[0]];
		RemoveAt(TP[i+1], TH[i+1]);
		TPL[i] = TP[0]-TI[i][1]*direction;
		THL[i] = TH[0]+TI[i][0]*direction;
	}
	if(ifArray(THL, TPL, "validityCheck")){
		TP[1] = TPL[0];
		TH[1] = THL[0];
		TP[2] = TPL[1];
		TH[2] = THL[1];
		TP[3] = TPL[2];
		TH[3] = THL[2];
	}
	//#endregion
	//#region Finish Rotation
	if(direction === 1){
		pieceState++;
		if(pieceState > 4){
			pieceState = 1
		}
	} else if(direction === -1){
		pieceState--;
		if(pieceState < 1){
			pieceState = 4;
		}
	}
	InsertAt(TP[1], TH[1]);
	InsertAt(TP[2], TH[2]);
	InsertAt(TP[3], TH[3]);
	reloadBoard();
	//#endregion
}
function moveDown(){
	RemoveAt(TP[0], TH[0])
	RemoveAt(TP[1], TH[1])
	RemoveAt(TP[2], TH[2])
	RemoveAt(TP[3], TH[3])
	TH[0]++;
	TH[1]++;
	TH[2]++;
	TH[3]++;
	InsertAt(TP[0], TH[0])
	InsertAt(TP[1], TH[1])
	InsertAt(TP[2], TH[2])
	InsertAt(TP[3], TH[3])
	reloadBoard()
}
function move(direction){
	if((direction === -1 && !validityCheck("L")) || (direction === 1 && !validityCheck("R"))){
		RemoveAt(TP[0], TH[0])
		RemoveAt(TP[1], TH[1])
		RemoveAt(TP[2], TH[2])
		RemoveAt(TP[3], TH[3])
		TP[0]+=direction;
		TP[1]+=direction;
		TP[2]+=direction;
		TP[3]+=direction;
		InsertAt(TP[0], TH[0])
		InsertAt(TP[1], TH[1])
		InsertAt(TP[2], TH[2])
		InsertAt(TP[3], TH[3])
		reloadBoard()
	}
}
//#endregion
//#region Game Events
function tick(){
	if(validityCheck("H")){
		SolidifyAt(TP[0], TH[0])
		SolidifyAt(TP[1], TH[1])
		SolidifyAt(TP[2], TH[2])
		SolidifyAt(TP[3], TH[3])
		ClearLines();
		newPiece();
	} else if(!Dropping){
		moveDown();
	}
}
function validityCheck(P1, P2, P3, P4){
	if(P1 == "H"){
		if(TH[0] < 19 && TH[1] < 19 && TH[2] < 19 && TH[3] < 19 && boardPosition[TH[0]+1][TP[0]] != 2 && boardPosition[TH[1]+1][TP[1]] != 2 && boardPosition[TH[2]+1][TP[2]] != 2 && boardPosition[TH[3]+1][TP[3]] != 2){
			return(false);
		} else{
			return(true);
		}
	}
	if(P1 == "L"){
		if(TP[0] >= 1 && TP[1] >= 1 && TP[2] >= 1 && TP[3] >= 1 && boardPosition[TH[0]][TP[0]-1] != 2 && boardPosition[TH[1]][TP[1]-1] != 2 && boardPosition[TH[2]][TP[2]-1] != 2 && boardPosition[TH[3]][TP[3]-1] != 2){
			return(false);
		} else{
			return(true);
		}
	}
	if(P1 == "R"){
		if(TP[0] <= 8 && TP[1] <= 8 && TP[2] <= 8 && TP[3] <= 8 && boardPosition[TH[0]][TP[0]+1] != 2 && boardPosition[TH[1]][TP[1]+1] != 2 && boardPosition[TH[2]][TP[2]+1] != 2 && boardPosition[TH[3]][TP[3]+1] != 2){
			return(false);
		} else{
			return(true);
		}
	}
	if(P1 && P2 && P3 && P4 && P1 != 2 && P2 != 2 && P3 != 2 && P4 != 2){
		return(false);
	} else{
		return(true);
	}
}
function recursivelySubtract(x, y){
	for(i=0;y-1<x;i++){
		x-=y
	}
	return [x, i];
}
function newPiece(){
	boardPosition.forEach(function(element, index, array){
		element.replace(/1/g, '2');
	});
	piece = nextPiece;
	nextPiece = Math.floor(Math.random()*(pieceShapes.length));
	nextShape = pieceShapes[nextPiece];
	pieceState = 1;
	var pieceShape = pieceShapes[piece];
	var TL = [];
	if(pieceShape.indexOf("2")){
		Rotation = true;
		TS[0] = pieceShape.indexOf("2");
		TS[1] = pieceShape.indexOf("1");
	} else{
		Rotation = false;
		TS[0] = pieceShape.indexOf("1");
		TS[1] = pieceShape.indexOf("1", TS[0]+1);
	}
	TL[0] = recursivelySubtract(TS[0], 4);
	TL[1] = recursivelySubtract(TS[1], 4);
	TP[0] = TL[0][0]+3;
	TH[0] = TL[0][1]+1;
	TP[1] = TL[1][0]+3;
	TH[1] = TL[1][1]+1;
	InsertAt(TP[0], TH[0]);
	InsertAt(TP[1], TH[1]);
	for(var i = 2; i < (pieceShape.match(/(1|2)/gi) || []).length; i++){
		TS[i] = pieceShape.indexOf("1", TS[i-1]+1);
		TL[i] = recursivelySubtract(TS[i], 4);
		TP[i] = TL[i][0]+3;
		TH[i] = TL[i][1]+1;
		InsertAt(TP[i], TH[i]);
	}
}
//#endregion
//#region To Be Sorted

//#endregion

