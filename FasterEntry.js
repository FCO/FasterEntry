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
	this.front.addEventListener("touchend",		this._endGetNewValue,	false);
	this.front.addEventListener("mouseup", 		this._endGetNewValue,	false);
	this.front.addEventListener("touchmove",	this._onTouchMove,	false);
	this.front.addEventListener("mousemove",	this._onTouchMove,	false);
	this.front.addEventListener("touchstart",	this._onTouchStart,	false);
	this.front.addEventListener("mousedown",	this._onTouchStart,	false);
}

FasterEntry.next_id = 1;

FasterEntry.default_template = "<span>R$<%= dolars %>,<%= cents %></span>";

FasterEntry.moneyIncrementDollars = function(data, deltaX, deltaY) {
	//console.log("moneyIncrementDollars");
	data.dolars -= parseInt(deltaY / 5);
	if(data.dolars < 0) data.dolars = 0;
}

FasterEntry.moneyIncrementCents = function(data, deltaX, deltaY) {
	//console.log("moneyIncrementCents");
	data.cents -= parseInt(deltaX / 5);
	if(data.cents >= 100) {
		data.dolars += parseInt(data.cents / 100);
		data.cents = data.cents % 100;
	}
	if(data.cents < 0) {
		if(data.dolars <= 0) {
			data.cents = 0;
		} else {
			data.dolars += parseInt(data.cents / 100) - 1;
			data.cents = data.cents % 100;
		}
	}
}

FasterEntry.money_modifiers = {
	dolars: {
		startWithX:	20,
		intervalX:	10,
		callback:	FasterEntry.moneyIncrementDollars,
	},
	cents: {
		startWithY:	20,
		intervalY:	10,
		callback:	FasterEntry.moneyIncrementCents,
	},
};

FasterEntry.prototype = {
	root:		document.body,
	front:		null,
	data:		null,
	callback:	null,
	touches:	null,
	actualModifier:	null,
	modLast:	null,
	last:		null,
	template:	new Template(FasterEntry.default_template),
	modifiers:	{},
	setTemplate:		function(template) {
		this.template = new Template(template);
	},
	getNewValueOf:		function(data, callback) {
		this.data = data;
		this.callback = callback;
		this.root.appendChild(this.front);
		this.render();
		this.content.style.top	= (this.front.offsetHeight / 2) - (this.content.offsetHeight / 2);
		this.content.style.left	= (this.front.offsetWidth  / 2) - (this.content.offsetWidth  / 2);
		this.modLast = {};
		this.last = {};
	},
	render:			function() {
		this.content.innerHTML	= this.template.render(this.data);
	},
	close:			function() {
		this.root.removeChild(this.front);
		if(this.callback) this.callback.call(this, this.data);
		this.touches		= [];
		this.callback		= null;
		this.data		= null;
		this.firstTouch		= null;
		this.actualModifier	= null;
		this.modLast		= {};
		this.last		= {};
	},
	touchStartHandler:		function(point) {
		if(!this.touches) this.touches = [];
		if(this.touches.length <= 0) {
			this.firstTouch = point;
			this.last = point;
			this.touches.push(point);
		}
		//console.log(point);
	},
	touchHandler:		function(point) {
		if(!this.touches || this.touches.length <= 0) {
			return;
		}
		//console.log("touchHandler");
		this.touches.push(point);
		this.dispatchModifier();
	},
	dispatchModifier:	function() {
		//console.log("dispatchModifier");
		var actual = this.actualModifier;
		var point = this.touches[this.touches.length - 1];
		if(actual) {
			var mod = this.modifiers[actual];
			var lastModPoint = this.modLast[actual];
			var deltaX = point.x - lastModPoint.x;
			var deltaY = point.y - lastModPoint.y;
			var okX = ! mod.intervalX || mod.intervalX >= deltaX;
			var okY = ! mod.intervalY || mod.intervalY >= deltaY;
			if(okX && okY) {
				console.log(this.data);
				mod.callback.call(this, this.data, deltaX, deltaY);
				this.modLast[actual] = point;
				this.last = point;
				this.render();
				return;
			}
		}
		for(var actual in this.modifiers) {
			//console.log(actual);
			var mod = this.modifiers[actual];
			//console.log(mod);
			var deltaX = point.x - this.last.x;
			//console.log(point.x + " - " + this.last.x);
			var deltaY = point.y - this.last.y;
			//console.log(point.y + " - " + this.last.y);
			//console.log("deltaX: [" + deltaX + "] deltaY: [" + deltaY + "]");
			var okX = ! mod.startWithX || mod.startWithX >= deltaX;
			var okY = ! mod.startWithY || mod.startWithY >= deltaY;
			if(okX && okY) {
				//console.log(this.data);
				mod.callback.call(this, this.data, deltaX, deltaY);
				this.actualModifier = actual;
				this.modLast[actual] = point;
				this.last = point;
				this.render();
				return;
			}
		}
	},
	_endGetNewValue:	function(e) {
		e.preventDefault();
		e.stopPropagation();
		this.obj.close();
	},
	_onTouchMove:		function(e) {
		e.preventDefault();
		e.stopPropagation();
		var touchPoint = {x: e.pageX, y: e.pageY, time: new Date()};
		this.obj.touchHandler(touchPoint);
	},
	_onTouchStart:		function(e) {
		e.preventDefault();
		e.stopPropagation();
		var touchPoint = {x: e.pageX, y: e.pageY, time: new Date()};
		this.obj.touchStartHandler(touchPoint);
	},
};
