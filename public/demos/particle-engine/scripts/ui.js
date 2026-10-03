// gets a hex value from rgb values- used to paint the square color selector on ui
function hexFromRGB(r, g, b) {
	var hex = [
		r.toString( 16 ),
		g.toString( 16 ),
		b.toString( 16 )
	];
	$.each( hex, function( nr, val ) {
		if ( val.length === 1 ) {
			hex[ nr ] = "0" + val;
		}
	});
	return hex.join( "" ).toUpperCase();
}

function refreshColors() {
	var red = $( "#red" ).slider( "value" ),
		green = $( "#green" ).slider( "value" ),
		blue = $( "#blue" ).slider( "value" );
	
	refreshSwatch(red, green, blue);
	
	ps_red = red / 256;
	ps_green = green / 256;
	ps_blue = blue / 256;
	
	// setColor(red, green, blue);
}

// refreshes color picker swatch to reflect up to date colors based on ui selections
function refreshSwatch(red, green, blue) {
	var hex = hexFromRGB( red, green, blue );
	$( "#swatch" ).css( "background-color", "#" + hex );
}

function refreshUI() {
	var force = $("#forceSlider").slider("value");
	$("#forceLabel").text(force);
	
	var angle = $("#angleSlider").slider("value");
	$("#angleLabel").text(angle);
	
	var speed = $("#speedSlider").slider("value");
	$("#speedLabel").text(speed);
	
	var spawn = $("#spawnSlider").slider("value");
	$("#spawnLabel").text(spawn);
	
	var refresh = $("#refreshSlider").slider("value");
	$("#refreshLabel").text(refresh);
	
	var size = $("#sizeSlider").slider("value");
	$("#sizeLabel").text(size);
	
	var lifetime = $("#lifetimeSlider").slider("value");
	$("#lifetimeLabel").text(lifetime);
}

function refreshParticleRefresh() {
	var refresh = $("#refreshSlider").slider("value");
	$("#refreshLabel").text(refresh);
	
	refresh_speed = refresh;
	
	ReloadWebGL();
}

// refreshes the particle force text and calls code to change particle force on canvas
function refreshParticleForce() {
	var force = $("#forceSlider").slider("value");
	$("#forceLabel").text(force);
	
	particle_force = force / 1000;
	
	ReloadWebGL();
}

// refreshes the particle angle and calls code to change appropriate values on canvas
function refreshParticleAngle() {
	var angle = $("#angleSlider").slider("value");
	
	$("#angleLabel").text(angle);

	particle_angle = angle;
	
	ReloadWebGL();
}

function refreshParticleSpeed() {
	var speed = $("#speedSlider").slider("value");
	$("#speedLabel").text(speed);
	
	particle_speed = speed / 100;
	
	ReloadWebGL();
}

// refreshes the particle spawn and calls code to change appropriate values on canvas
function refreshParticleSpawn() {
	var spawn = $("#spawnSlider").slider("value");
	$("#spawnLabel").text(spawn);
	
	particle_spawn = (100 - spawn) / 1000;
	
	ReloadWebGL();
}

function refreshParticleSize() {
	var size = $("#sizeSlider").slider("value");
	$("#sizeLabel").text(size);

	particle_size = size / 100.0;
	
	ReloadWebGL();
}

function refreshParticleLifetime() {
	var lifetime = $("#lifetimeSlider").slider("value");
	$("#lifetimeLabel").text(lifetime);
	
	particle_lifetime = lifetime;
	
	ReloadWebGL();
}

// initializes jquery ui elements
$(function() {
	$( "#red, #green, #blue" ).slider({
		orientation: "horizontal",
		range: "min",
		max: 255,
		value: 127,
		slide: refreshColors,
		change: refreshColors
	});
	$( "#red" ).slider( "value", 128 );
	$( "#green" ).slider( "value", 128 );
	$( "#blue" ).slider( "value", 128 );
	
	$("#billboard-radio-container").buttonset();
	

	$("#billboard-yes").click(function(){
		billboard = true;	
	});
		
	$("#billboard-no").click(function(){
		billboard = false;
	});
	
	$('#billboard-no').trigger('click');
		
	
	$("#face-toggle-container-one").buttonset();
	$("#face-toggle-container-two").buttonset();
	$("#background-toggle").buttonset();
	
	$("#background-black").click();
	
	$( "#forceSlider" ).slider({
		orientation: "horizontal",
		range: "min",
		max: 2000,
		min: 1,
		value: 1000,
		slide: refreshParticleForce,
		change: refreshParticleForce
	});
	
	$( "#angleSlider" ).slider({
		orientation: "horizontal",
		range: "min",
		max: 360,
		min: 1,
		value: 360,
		slide: refreshParticleAngle,
		change: refreshParticleAngle
	});	
	
	$( "#spawnSlider" ).slider({
		orientation: "horizontal",
		range: "min",
		max: 100,
		min: 1,
		value: 1,
		slide: refreshParticleSpawn,
		change: refreshParticleSpawn
	});
	
	$("#speedSlider").slider({
		orientation: "horizontal",
		range: "min",
		max: 20,
		min: 1,
		value: 10,
		slide: refreshParticleSpeed,
		change: refreshParticleSpeed
	});
	
	$("#refreshSlider").slider({
		orientation: "horizontal",
		range: "min",
		max: 1000,
		min: 50,
		value: 500,
		slide: refreshParticleRefresh,
		change: refreshParticleRefresh
	});
	
	$("#sizeSlider").slider({
		orientation: "horizontal",
		range: "min",
		max: 100,
		min: 1,
		value: 50,
		slide: refreshParticleSize,
		change: refreshParticleSize
	});
	
	$("#lifetimeSlider").slider({
		orientation: "horizontal",
		range: "min",
		max: 50,
		min: 1,
		value: 20,
		slide: refreshParticleLifetime,
		change: refreshParticleLifetime
	});
	
	$('select#texture').selectmenu({style:'popup'});
	
	$("select#texture").change(function() {
		var texture = $("#texture").val();
		
		if (texture == "None") {
			particle_enable_texture = false;
		}
		else {
			particle_enable_texture = true;
			particle_texture = texture;
		}
		
		// alert(texture);
		
		ReloadWebGL();
	});
	
	refreshUI();
	
	
});

function ResetUI() {
	$("#face-toggle-front").prop('checked', false);
	$("#face-toggle-back").prop('checked', false);
	$("#face-toggle-top").prop('checked', false);
	$("#face-toggle-bottom").prop('checked', false);
	$("#face-toggle-right").prop('checked', false);
	$("#face-toggle-left").prop('checked', false);
}

/* initialize ui events */
$("#background-white").click(function() {
	// todo: review class models in javascript and use one instead of globals
	canvasBackgroundColor = 1.0;
});

$("#background-black").click(function() {
	// todo: review class models in javascript and use one instead of globals
	canvasBackgroundColor = 0.0;
});

$("#face-toggle-front").click(function() {
	var red = front_r * 255;
	var green = front_g * 255;
	var blue = front_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
$("#face-toggle-back").click(function() {
	var red = back_r * 255;
	var green = back_g * 255;
	var blue = back_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
$("#face-toggle-top").click(function() {
	var red = top_r * 255;
	var green = top_g * 255;
	var blue = top_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
$("#face-toggle-bottom").click(function() {
	var red = bottom_r * 255;
	var green = bottom_g * 255;
	var blue = bottom_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
$("#face-toggle-right").click(function() {
	var red = right_r * 255;
	var green = right_g * 255;
	var blue = right_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
$("#face-toggle-left").click(function() {
	var red = left_r * 255;
	var green = left_g * 255;
	var blue = left_b * 255;
	
	$( "#red" ).slider( "value", red);
	$( "#green" ).slider( "value", green);
	$( "#blue" ).slider( "value", blue);
	
	refreshSwatch(red, green, blue);
});
