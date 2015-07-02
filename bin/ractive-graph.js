
Ractive.components['graph'] = Ractive.extend({
	isolated: true,
	data: {
		width: "100%",
		height: "500px"
	},
	template: "<div id='{{id}}' style='position: relative; width: {{width}}; height: {{height}};' class='{{class}}'>{{yield}}</div>",
	onconfig: function() {
		this.edges = {}
	},
	onrender: function() {
		var self = this
		var div = self.find('*')
		
		function updateNode( e, saveData ) {
			var x = e.clientX - self.dragged.dx
			var y = e.clientY - self.dragged.dy
			
			// check boundaries
			if( x < 0 )
				x = 0
			else if( x > div.clientWidth - self.dragged.width )
				x = div.clientWidth - self.dragged.width
				
			if( y < 0 )
				y = 0
			else if( y > div.clientHeight - self.dragged.height )
				y = div.clientHeight - self.dragged.height
			
			// update node coords
			if( saveData ) {
				self.dragged.node.set({x:x,y:y})
			}
			else {
				self.dragged.elem.style.left = x + "px"
				self.dragged.elem.style.top = y + "px"
			}
			
			// update connected edges
			var connections = self.edges[self.dragged.id]
			if( connections ) {
				for(var i in connections)
					connections[i].update( saveData )
			}
		}
		
		// dropping a node
		div.addEventListener('mouseup', function(e){
			if( !self.dragged )
				return
				
			updateNode(e, true )
			self.dragged.elem.style.zIndex = 2 // place the node again in its normal z-index
			self.dragged = null
			
			e.stopPropagation()
		})
		
		// stop dragging when going out of the graph
		div.addEventListener('mouseleave', function(e){
			if( !self.dragged )
				return
				
			updateNode(e, true )
			self.dragged.elem.style.zIndex = 2 // place the node again in its normal z-index
			self.dragged = null
			
			e.stopPropagation()
		})
		
		// dragging the node
		div.addEventListener('mousemove', function(e) {
			if( !self.dragged )
				return
			
			updateNode(e, false)
			
			e.stopPropagation()
		})
	}
})

Ractive.components['node'] = Ractive.extend({
	isolated: true,
	data: {
		draggable: true
	},
	template: "<div id='node_{{id}}' class='{{class}}' style='position: absolute; z-index: 2; left: {{x}}px; top: {{y}}px; {{style}}' onclick='{{onclick}}'>{{yield}}</div>",
	onrender: function() {
		var self = this
		var div = self.find('*')
		var graph = this.container
		
		// starts the dragging
		div.addEventListener('mousedown', function(e) {
			if( !self.get('draggable') )
				return
				
			div.style.zIndex = 3 // show it on top of other nodes while dragging
			graph.dragged = {
				node: self,
				id: self.get('id'),
				elem: div,
				dx: e.clientX - div.offsetLeft,
				dy: e.clientY - div.offsetTop,
				width: div.offsetWidth,
				height: div.offsetHeight
			}
			
			e.preventDefault() // to prevent starting to select text
			e.stopPropagation()
		})
	}
})

Ractive.components['edge'] = Ractive.extend({
	isolated: true,
	template: "<svg style='position: absolute; z-index: 1; display: inline-block; width: 100%; height: 100%; pointer-events: none;' ><line x1='{{x1}}' y1='{{y1}}' x2='{{x2}}' y2='{{y2}}' class='{{class}}' style='pointer-events: auto; {{style}}' onclick='{{onclick}}' /></svg><span style='position: absolute; z-index: 2;'>{{yield}}</span>",
	oninit: function() {
		var from = this.get('from')
		var to = this.get('to')
		if( !from || !to )
			return
		
		var graph = this.container
		
		// register oneself in the node's connected edges
		if( graph.edges[from] )
			graph.edges[from].push( this )
		else
			graph.edges[from] = [this]
			
		
		if( graph.edges[to] )
			graph.edges[to].push( this )
		else
			graph.edges[to] = [this]
	},
	onrender: function() {
		var from = document.getElementById('node_' + this.get('from'))
		var to = document.getElementById('node_' + this.get('to'))
		if( !from || !to )
			return
		
		var self = this
		var svg = this.find("svg")
		var line = this.find("line")
		var content = this.find("span")
		
		this.update = function(saveData) {
			var coords = {
				x1: from.offsetLeft + from.offsetWidth / 2,
				x2: to.offsetLeft + to.offsetWidth / 2,
				y1: from.offsetTop + from.offsetHeight / 2,
				y2: to.offsetTop + to.offsetHeight / 2
			}
			if( saveData ) {
				self.set(coords)
			}
			else {
				line.setAttribute('x1', coords.x1)
				line.setAttribute('x2', coords.x2)
				line.setAttribute('y1', coords.y1)
				line.setAttribute('y2', coords.y2)
			}
			content.style.left = ((coords.x1 + coords.x2 - content.offsetWidth) / 2) + "px"
			content.style.top = ((coords.y1 + coords.y2 - content.offsetHeight) / 2) + "px"
		}
		this.update( true )
	},
	onteardown: function() {
		var from = this.get('from')
		var to = this.get('to')
		if( !from || !to )
			return
		
		var graph = this.container
		
		function removeFrom( obj, list ) {
			if( !obj || !list )
				return
			var index = list.indexOf(obj)
			if( index >= 0 )
				list.splice(index, 1)
		}
		
		removeFrom( this, graph.edges[from] )
		removeFrom( this, graph.edges[to] )
	}
})