/**
 * IconGen
 *
 * @version    0.1.2
 * @author     Hiroshi Hoaki <rewish.org@gmail.com>
 * @copyright  (c) 2012 Rewish
 * @license    http://rewish.org/license/mit The MIT License
 * @link       http://rewish.github.com/IconGen/
 */
;(function(window) {
	var IconGen,
	    rimage = /image\/\w+/,
	    URL = window.URL || window.webkitURL;

	IconGen = function(canvas, options) {
		if (!(this instanceof IconGen)) {
			return new IconGen(canvas, options);
		}
		this.initialize.apply(this, arguments);
		return this;
	};

	IconGen.isSupport = typeof window.FileReader !== 'undefined';

	IconGen.enable = function() {
		if (!IconGen.isSupport) {
			return;
		}

		var body = document.body,
		    className = body.getAttribute('class').replace(/ig-nojs/g, '');

		if (className === '') {
			body.removeAttribute('class');
		} else {
			body.setAttribute('class', className);
		}
	};

	IconGen.defaultOptions = {
		suffix: '_ig',
		drawSize: 100,
		framePaths: null,
		onReadFile: null,
		onFileTypeError: null,
		onRenderError: null,
		onRender: null,
		onRendered: null,
		onExit: null
	};

	IconGen.prototype.initialize = function(canvas, options) {
		if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
			throw new Error();
		}
		this.canvas = canvas;
		this.setOptions(options);
	};

	IconGen.prototype.setOptions = function(options) {
		var key;

		if (typeof this.options !== 'object') {
			this.options = {};
			for (key in IconGen.defaultOptions) {
				this.options[key] = IconGen.defaultOptions[key];
			}
		}

		if (typeof options !== 'object') {
			return;
		}

		for (key in options) {
			this.options[key] = options[key];
		}

		if ('framePaths' in options) {
			this.setupFrames();
		}
	};

	IconGen.prototype.setDrawSize = function(drawSize) {
		this.options.drawSize = drawSize;
	};

	IconGen.prototype.setupFrames = function() {
		if (!this.options.framePaths
				|| this.options.framePaths.length === 0) {
			throw new Error();
		}

		var framePaths = this.options.framePaths,
		    framePath, i = 0;

		this.frames = new Array(framePaths.length);

		for (; framePath = framePaths[i]; ++i) {
			this.frames[i] = new Image();
			this.frames[i].src = framePath.value || framePath;
		}

		this.frame = this.frames[0];
	};

	IconGen.prototype.readFile = function(file) {
		this.callback('onReadFile', file);

		if (!file || !rimage.test(file.type)) {
			this.callback('onFileTypeError');
			return;
		}

		this.fileName = file.name;

		var self = this,
		    reader = new FileReader();

		reader.onload = function() {
			var image = new Image();
			image.onload = function() {
				self.image = this;
				self.render();
			};
			image.src = reader.result;
		};

		reader.readAsDataURL(file);
	};

	IconGen.prototype.changeFrame = function(index) {
		this.frame = this.frames[index];

		if (this.image) {
			this.render();
		}
	};

	IconGen.prototype.render = function() {
		this.callback('onRender');

		if (!this.image) {
			this.callback('onRenderError');
		}

		var drawInfo = this.getDrawInfo(),
		    context = this.canvas.getContext('2d');

		this.canvas.width  = drawInfo.size;
		this.canvas.height = drawInfo.size;

		context.clearRect(0, 0, drawInfo.size, drawInfo.size);
		context.drawImage(this.image, drawInfo.x, drawInfo.y, drawInfo.width, drawInfo.height);

		if (this.frame) {
			context.drawImage(this.frame, 0, 0, drawInfo.size, drawInfo.size);
		}

		this.callback('onRendered', drawInfo);
	};

	IconGen.prototype.getDrawInfo = function() {
		var drawInfo = {
			size: this.options.drawSize,
			scale: 0,
			width: 0,
			height: 0,
			x: 0,
			y: 0
		};

		drawInfo.scale  = drawInfo.size / Math.max(this.image.width, this.image.height);
		drawInfo.width  = Math.round(this.image.width * drawInfo.scale);
		drawInfo.height = Math.round(this.image.height * drawInfo.scale);

		drawInfo.x = (drawInfo.size - drawInfo.width) / 2;
		drawInfo.y = (drawInfo.size - drawInfo.height) / 2;

		return drawInfo;
	};

	IconGen.prototype.getFileURL = function() {
		var dataURL = this.canvas.toDataURL('image/png');
		if (typeof URL !== 'undefined'
				&& typeof dataURLtoBlob !== 'undefined') {
			return URL.createObjectURL(dataURLtoBlob(dataURL));
		}
		return dataURL;
	};

	IconGen.prototype.getFileName = function() {
		return this.fileName.replace(/\.\w+$/, this.options.suffix + '.png');
	};

	IconGen.prototype.exit = function() {
		this.image = null;
		this.callback('onExit');
	};

	IconGen.prototype.callback = function(name) {
		var fn = this.options[name],
		    args = [],
		    len = arguments.length,
		    i = 1;

		for (; i < len; ++i) {
			args[args.length] = arguments[i];
		}

		if (fn && typeof fn === 'function') {
			fn.apply(this, args);
		}
	};

	window.IconGen = IconGen;
}(this));