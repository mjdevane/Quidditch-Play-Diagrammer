window.onload = function(){

	/* 
	 * methods for using JQuery Draggable API
	 */
	$(".token-img").draggable({
		revert: "invalid",
		// this makes it jump straight to the canvas, which is a little weird, but better than the alternatives I tried
		containment: "#CanvasContainer",
		helper: "clone",
		start: function(event, ui) {
				$(ui.helper).width(25);
			},
		appendTo: "#CanvasContainer"
	});
	
	$("#CanvasContainer").droppable({
		accept: ".token-img, .token-img-active",
		tolerance: "pointer",
		drop: function( event, ui ) {
		   var $droppable = $(this);
		   var $draggable = ui.draggable;
		   if (!$draggable.hasClass("token-img-active")) {
				$draggable = $draggable.clone();
				$draggable.addClass("token-img-active");
				// absolute sizes might not be portable, but makes sure scale isn't off
				// tokens are ~1.5 meters on pitch scale
				$draggable.width("25px");
				$droppable.attr("tokencount", (parseInt($droppable.attr("tokencount"))+1).toString());
				$draggable.attr("id", "token_" + $droppable.attr("tokencount"));
				$draggable.attr("z-index", "2");
		   }
		   
		   var draggableOffset = ui.helper.offset(),
                droppableOffset = $droppable.offset(),
                left = draggableOffset.left - droppableOffset.left,
                thisTop = draggableOffset.top - droppableOffset.top;

            $draggable.css({
                "position": "absolute",
                "left": left,
                "top": thisTop
            });
			$draggable.appendTo($droppable);
		   
			$(".token-img-active").draggable({
				containment: "#CanvasContainer",
				prependTo: "#CanvasContainer"
			});
		}
    });
	
	/*
	 * methods for handling the context menu
	 */
	
	// hide on mouseclick elsewhere
	// unfocus didn't work, non-hover was finnicky
	$("#CanvasContainer").click( function(e) {
		if (!$(e.target).parents("#ContextMenu").length) {
			$("#ContextMenu").hide();
		}
	});
	
	// only let one dropdown be open at a time
	$(".dropdown-toggle").on("click", function(e) {
		$(this).next(".dropdown-menu").toggle();
		$(this).parent().siblings(".dropdown-submenu").children(".dropdown-menu").hide();
		
	});
	
	// player cannot have a ball if off broom, vice versa
	// could have used radio buttons, but since neither is a valid choice, checksboxes made more sense
	$("input:checkbox").click(function() {
        $("input:checkbox").not(this).prop("checked", false);
		$token = $("#" + ($("#ContextMenu").attr("activetoken")));
		if ($(this).prop("checked")) {
			$token.attr("status", $(this).attr("value"));
		} else {
			$token.attr("status", "");
		}
		// token img attributes combine to form source
		$token.attr("src", "/assets/tokens/token_" + $token.attr("team") + "_" + $token.attr("position") + "_" + $token.attr("status") + ".png");
    });
	
	$(document).on("contextmenu", function(e) {
		if ($(e.target).is(".token-img-active")) {
			
			var $teamRadios = $("input:radio[name=team]");
			var $positionRadios = $("input:radio[name=position]");
			var $checks = $("input:checkbox");
			$teamRadios.filter("[value=" + $(e.target).attr("team") + "]").prop("checked", true);
			$positionRadios.filter("[value=" + $(e.target).attr("position") + "]").prop("checked", true);
			$checks.prop("checked", false);
			if ($(e.target).attr("status") != "") {
				$checks.filter("[value=" + $(e.target).attr("status") + "]").prop("checked", true);
			}
			
			// context menu always exists, we just reposition and show it on right click
			var pos = $(e.target).position();
			$("#ContextMenu").css({top: pos.top, left: pos.left, position:"absolute"});
			$("#ContextMenu").attr("activetoken", $(e.target).attr("id"));
			$("#ContextMenu").show();
			$("#ContextMenu2").show();
			return false;
		}
	});
	
	$("#DeleteButton").click(function() {
		$("#" + ($("#ContextMenu").attr("activetoken"))).remove();
		$("#ContextMenu").hide();
		$("#ContextMenu").attr("activetoken", "");
	});
	
	$("input[name='position']").change(function() {
		$token = $("#" + ($("#ContextMenu").attr("activetoken")));
		$token.attr("position", $(this).attr("value"));
		$token.attr("src", "/assets/tokens/token_" + $token.attr("team") + "_" + $token.attr("position") + "_" + $token.attr("status") + ".png");
	});
	
	$("input[name='team']").change(function() {
		$token = $("#" + ($("#ContextMenu").attr("activetoken")));
		$token.attr("team", $(this).attr("value"));
		$token.attr("src", "/assets/tokens/token_" + $token.attr("team") + "_" + $token.attr("position") + "_" + $token.attr("status") + ".png");
	});
	
	context = $("#DrawingCanvas").get(0).getContext("2d");

	
	/*
     * event handlers for canvas drawing
	 */
	$("#CanvasContainer").on("mousedown", ".canvas-active", function(e) {
		if (e.which == 1) {
			var mouseX = e.pageX;
			var mouseY = e.pageY;
			paint = true;
			addClick(e.pageX, e.pageY);
			redraw();
		}
	});
	
	$("#CanvasContainer").on("mousemove", ".canvas-active", function(e) {
		if(paint) {
			var mouseX = e.pageX;
			var mouseY = e.pageY;
			addClick(mouseX, mouseY, true);
			redraw();
		}
	});	
	
	$("#CanvasContainer").on("mouseup", ".canvas-active", function() {
		paint = false;
	});
	
	$("#CanvasContainer").on("mouseleave", ".canvas-active", function() {
		paint = false;
	});	
	
	// use empty event handlers when drag tool selected
	$("#CanvasContainer").on("mousedown", ".canvas-inactive", function() {});	
	$("#CanvasContainer").on("mousemove", ".canvas-inactive", function() {});	
	$("#CanvasContainer").on("mouseup", ".canvas-inactive", function() {});	
	$("#CanvasContainer").on("mouseleave", ".canvas-inactive", function() {});	
	
	
	// switch between drawing mode and token dragging mode
	// move canvas to front/back
	// HTML handles depth really weird; reordering DOM elements is the best way I've found
	$("#DragTool").change(function(){
		if ($(this).is(":checked")) {
			$("#DrawingCanvas").removeClass("canvas-active").addClass("canvas-inactive");
			$(".token-img-inactive").removeClass("token-img-inactive").addClass("token-img-active");
			$("#DrawingCanvas").parent().prepend($("#DrawingCanvas"));
		}
	});
	
	$("#DrawTool").change(function(){
		if ($(this).is(":checked")) {
			$("#DrawingCanvas").removeClass("canvas-inactive").addClass("canvas-active");
			$(".token-img-active").removeClass("token-img-active").addClass("token-img-inactive");
			$("#DrawingCanvas").parent().append($("#DrawingCanvas"));
		}
	});

	$("#CanvasClearBtn").click(function(e){
		resetCanvas();
	});
	$("#WidthPicker").change(function(e) {
		$(this).attr("value", $(this).val());
	});
	$("#TokenClearBtn").click(function(e){
		clearTokens();
	});

}

// Set the width of the sidebar to 25% (show it) and push over the rest of the page
// I'm a little concerned about portability, but I haven't had a chance to test it on anything other than my laptop
// consider this for future improvement
function openNav() {
  document.getElementById("Sidebar").style.width = "25%";
  document.getElementById("NonSidebar").style.marginLeft = "25%";
  document.getElementById("OpenBtn").style.display = "none";
  document.getElementById("OpenBtn").class = "openbtn";
}

/* Set the width of the sidebar to 0 (hide it) */
function closeNav() {
	document.getElementById("Sidebar").style.width = "0";
    document.getElementById("NonSidebar").style.marginLeft = "0px";
	document.getElementById("OpenBtn").style.display = "inline-block";
	document.getElementById("OpenBtn").class = "openbtn sticky";
}

function openTab(evt, tabName) {
  // Declare all variables
  var i, tabcontent, tablinks;

  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

// not necessary unless we add back in different sized backgrounds
function fitToContainer(canvasName){
  var canvas = document.getElementById(canvasName)
  canvas.style.width="100%";
  canvas.style.height="100%";
  canvas.width  = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function setCanvasBackground(e) {
	var cancont = document.getElementById("CanvasContainer");
	cancont.style.backgroundImage = `url(${e.src})`;
	var cansizer = document.getElementById("CanvasResizer");
	cansizer.src = e.src;
}

/* 
 * handle canvas drawing tool
 */

var clickX = new Array();
var clickY = new Array();
var clickDrag = new Array();
var clickColor = new Array();
var clickSize = new Array();
var paint;

function addClick(x, y, dragging) {
	var rect = context.canvas.getBoundingClientRect();
	clickX.push(x - rect.left);
	clickY.push(y - rect.top);
	clickDrag.push(dragging);
	clickColor.push($("#ColorPicker").val());
	clickSize.push($("#WidthPicker").val());
}

// make canvas continually update as mouse moves
function redraw() {
	clearCanvas();
	
	context.lineJoin = "round";
		
	for(var i=0; i < clickX.length; i++) {		
		context.beginPath();
		setLineColor(clickColor[i]);
		setLineWidth(clickSize[i]);
		if(clickDrag[i] && i){
			context.moveTo(clickX[i-1], clickY[i-1]);
		}else{
			context.moveTo(clickX[i]-1, clickY[i]);
		}
		context.lineTo(clickX[i], clickY[i]);
		context.closePath();
		context.stroke();
	}
}

function clearCanvas() {
	context.clearRect(0, 0, context.canvas.width, context.canvas.height); // Clears the canvas
}

function resetCanvas() {
	clearCanvas();
	clickX = new Array();
	clickY = new Array();
	clickDrag = new Array();
	clickColor = new Array();
	clickSize = new Array();
}

function setLineColor(color) {
	context.strokeStyle = color;
}

function setLineWidth(width) {
	context.lineWidth = width;
}

function clearTokens() {
	$(".token-img-active, .token-img-inactive").remove();
}
