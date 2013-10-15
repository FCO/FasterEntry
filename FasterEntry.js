Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (var i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

function FasterEntry(template, modifiers, root) {
	if(template == null)	template = this.default_template;
	if(modifiers == null)	modifiers = FasterEntry.money_modifiers;
	if(root == null)	root = document.body;

	this.root = root;
	this.id = FasterEntry.next_id++;

	this.canvas = document.createElement("CANVAS");
	this.canvas.id = "faster_entry_canvas_id_" + this.id;
	this.canvas.obj = this;
	this.canvas.className	= "faster_entry_canvas";

	this.front = document.createElement("DIV");
	this.front.id = "faster_entry_front_id_" + this.id;
	this.front.obj = this;
	this.front.className	= "faster_entry_front";

	this.content	= document.createElement("DIV");
	this.content.id	= "content";
	this.modifiers = modifiers;
	this.front.appendChild(this.content);
	this.cancelImage = new Image(this.cancelImgURL);
	Hammer.plugins.fakeMultitouch();
	Hammer.plugins.showTouches();
	Hammer(this.front)
		.on("dragend",		this._endGetNewValue	)
		.on("drag",		this._onTouchMove	)
		.on("dragstart",	this._onTouchStart	)
	;
}

FasterEntry.next_id = 1;

FasterEntry.default_template = "<span>R$<%= parseInt(dolars) %>,<%= parseInt(cents) %></span>";

FasterEntry.moneyIncrementDollars = function(data, distance) {
	console.log(data);
	data.dolars += distance;
	if(data.dolars < 0) data.dolars = 0;
	return data;
}

FasterEntry.moneyIncrementCents = function(data, distance) {
	console.log(data);
	data.cents += distance;
	if(data.cents >= 100) {
		data.dolars += parseInt(data.cents / 100);
		data.cents = data.cents % 100;
	}
	if(data.cents < 0) {
		if(data.dolars <= 0) {
			data.cents = 0;
		} else {
			data.dolars -= parseInt(data.cents / 100) - 1;
			data.cents = 100 + data.cents % 100;
		}
	}
	return data;
}

FasterEntry.money_modifiers = {
	incrCents: {
		reversable:	true,
		directions:	[Hammer.DIRECTION_RIGHT],
		startWith:	3,
		interval:	30,
		callback:	FasterEntry.moneyIncrementCents,
	},
	dollars: {
		reversable:	true,
		directions:	[Hammer.DIRECTION_UP],
		startWith:	3,
		interval:	30,
		callback:	FasterEntry.moneyIncrementDollars,
	},
};

FasterEntry.prototype = {
	root:		document.body,
	reverse:	{
				right:	Hammer.DIRECTION_LEFT,
				left:	Hammer.DIRECTION_RIGHT,
				up:	Hammer.DIRECTION_DOWN,
				down:	Hammer.DIRECTION_UP,
			},
	front:		null,
	initialData:	null,
	actualData:	null,
	callback:	null,
	touches:	null,
	actualModifier:	null,
	modLast:	null,
	last:		null,
	cancelImgURL:	"./cancel.png",
	template:	new Template(FasterEntry.default_template),
	modifiers:	{},
	setTemplate:		function(template) {
		this.template = new Template(template);
	},
	getNewValueOf:		function(data, callback) {
		var _this = this;
		Mousetrap.bind("enter", function(){
			_this.close();
		});
		Mousetrap.bind("esc", function(){
			_this.cancel();
		});
		Mousetrap.bind("up", function(){
			_this.actualData = FasterEntry.moneyIncrementDollars.call(_this, _this.actualData.clone(), 1);
			_this.render();
		});
		Mousetrap.bind("down", function(){
			_this.actualData = FasterEntry.moneyIncrementDollars.call(_this, _this.actualData.clone(), -1);
			_this.render();
		});
		Mousetrap.bind("right", function(){
			_this.actualData = FasterEntry.moneyIncrementCents.call(_this, _this.actualData.clone(), 1);
			_this.render();
		});
		Mousetrap.bind("left", function(){
			_this.actualData = FasterEntry.moneyIncrementCents.call(_this, _this.actualData.clone(), -1);
			_this.render();
		});
		this.actualData = this.initialData = data;
		this.callback = callback;
		this.root.appendChild(this.front);
		//this.root.appendChild(this.canvas);
		this.canvasContext = this.canvas.getContext("2d");
		this.render();
		this.content.style.top	= (this.front.offsetHeight / 2) - (this.content.offsetHeight / 2);
		this.content.style.left	= (this.front.offsetWidth  / 2) - (this.content.offsetWidth  / 2);
		this.modLast = {};
		this.last = {};
	},
	render:			function() {
		this.content.innerHTML	= this.template.render(this.actualData);
	},
	close:			function() {
		if(this.callback) this.callback.call(this, this.actualData);
		this._close();
	},
	cancel:			function() {
		this._close();
	},
	_close:			function() {
		Mousetrap.reset();
		this.root.removeChild(this.front);
		this.touches		= [];
		this.callback		= null;
		this.initialData	= null;
		this.actualData		= null;
		this.lastData		= null;
		this.lastDirection	= null;
		this.firstTouch		= null;
		this.actualModifier	= null;
		this.modLast		= {};
		this.last		= {};
	},
	touchHandler:		function(touch_event) {
		this.dispatchModifier(touch_event);
	},
	dispatchModifier:	function(touch_event) {
		console.log(touch_event.direction + " - " + touch_event.distance);
		if(this.lastDirection == null) {
console.log("initial");
			this.lastData = this.initialData.clone();
		} else if(this.lastDirection != touch_event.direction) {
console.log("change");
			this.lastData = this.actualData.clone();
		}
		
		for(var actual in this.modifiers) {
			if(!this.modifiers.hasOwnProperty(actual)) continue;
			var mod = this.modifiers[actual];
			var dir = false;
			var reverse = false;
			for(var i = 0; i < mod.directions.length; i++) {
				if(touch_event.direction == mod.directions[i]) {
					dir = true;
					break;
				}
				if(touch_event.direction == this.reverse[mod.directions[i]]) {
					dir = true;
					reverse = true;
					break;
				}
			}
			if(dir) {
				this.lastDirection = touch_event.direction;
				var ok = mod.startWith == null || Math.abs(mod.startWith) <= Math.abs(touch_event.distance);

				if(mod && ok) {
					var deltaX = 0, deltaY = 0;
					if(mod.interval)
						distance = (touch_event.distance - (touch_event.distance / Math.abs(touch_event.distance) * mod.startWith)) / mod.interval;
					this.actualData = mod.callback.call(this, this.lastData.clone(), (!reverse?1:-1) * distance);
					this.render();
					return;
				}
			}
		}
	},
	_endGetNewValue:	function(e) {
		e.gesture.preventDefault();
		this.obj.close();
	},
	_onTouchMove:		function(e) {
		e.gesture.preventDefault();
		var gest = e.gesture;
		this.obj.touchHandler(gest);
	},
	_onTouchStart:		function(e) {
		e.gesture.preventDefault();
		var gest = e.gesture;
		//this.canvasContext.drawImage(this.cancelImage, gest.pageX, gest.pageY);
	},
};
