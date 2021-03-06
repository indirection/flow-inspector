var GraphPageView = PageView.extend({
	events: {
		"click .timeline-value a": "clickTimelineValue",

		"click a.reset": "clickLayoutReset",
		"click a.force": "clickLayoutForce",
		"click a.hilbert": "clickLayoutHilbert",

		"blur #gravity" : "changeGravity",
		"blur #linkdistance" : "changeLinkDistance",
		"blur #charge" : "changeCharge",

		"change #filterNodeLimit": "changeNodeLimit",

		"click a.apply-filter": "clickApplyFilter",
		"blur #filterProtocols": "changeFilterProtocols",
		"blur #filterPorts": "changeFilterPorts",
		"blur #filterIPs": "changeFilterIPs",
		"change #filterPortsType": "changeFilterPortsType",
		"change #filterProtocolsType": "changeFilterProtocolsType",
		"change #filterIPsType": "changeFilterIPsType",

		"change #showOthers": "changeShowOthers"
	},
	initialize: function() {
		this.template = _.template($("#graph-page-template").html());
		this.loaderTemplate = _.template($("#loader-template").html());
		
		var that = this;
		// make function available to unbind later
		this._onResize = function() { that.render(); };
		$(window).bind("resize", this._onResize);
		
		this.nodes = new IndexQuery(null, { index: "nodes" });
		this.flows = new Flows();
		this.timelineModel = new TimelineModel();
		this.timelineModel.bind("change:value", this.changeTimelineValue, this);
		this.graphModel = new GraphModel();

		this.timelineView = new TimelineView({
			model: this.timelineModel
		});
		this.graphView = new GraphView({
			nodes: this.nodes,
			flows: this.flows,
			timeline: this.timelineModel,
			model: this.graphModel
		});
    	
		// bind after initialization of GraphView to get event after the GraphView instance
		this.nodes.bind("reset", this.finishedNodesLoading, this);
		this.flows.bind("reset", this.updateIfLoaded, this);
    	
		this.timelineModel.bind("change:interval", this.changeBucketInterval, this);
		this.graphModel.bind("change:nodeLimit", this.nodeLimitChanged, this);
		this.graphModel.bind("change:showOthers", this.showOthersChanged, this);

		// fetch at the end because a cached request calls render immediately!
		this.fetchNodes();
	},
	remove: function() {
		if(this.timelineView) {
			this.timelineView.remove();
		}
		if(this.graphView) {
			this.graphView.remove();
		}
    	
		$(window).unbind("resize", this._onResize);
		$(this.el).remove();
		return this;
	},
	render: function() {
		$(this.el).html(this.template());
    		
		this.loader = $(this.loaderTemplate());
		$(".content", this.el).append(this.loader);
    	
		this.contentScrollApi = $(".content .scroll", this.el)
			.jScrollPane()
			.data("jsp");
		this.asideScrollApi = $("aside", this.el)
			.jScrollPane()
			.data("jsp");
		
		$("#footbar", this.el).append(this.timelineView.el);
		// rewire events because we removed the view from the dom
		this.timelineView.delegateEvents();
		this.timelineView.render();
    	
		$(".canvas", this.el).append(this.graphView.el);
		// rewire events because we removed the view from the dom
		this.graphView.delegateEvents();
		this.graphView.render();
		
		this.updateIfLoaded();
    	
		// form defaults
		$("#filterPorts", this.el).val(this.graphModel.get("filterPorts"));
		$("#filterPortsType", this.el).val(this.graphModel.get("filterPortsType"));
    		$("#filterIPs", this.el).val(this.graphModel.get("filterIPs"));
		$("#filterIPsType", this.el).val(this.graphModel.get("filterIPsType"));
    		$("#filterProtocols", this.el).val(this.graphModel.get("filterProtocols"));
		$("#filterProtocolsType", this.el).val(this.graphModel.get("filterProtocolsType"));

		$("#charge", this.el).val(this.graphModel.get("charge"));
		$("#gravity", this.el).val(this.graphModel.get("gravity"));
		$("#linkdistance", this.el).val(this.graphModel.get("linkDistance"));

		$("#filterNodeLimit", this.el).val(this.graphModel.get("nodeLimit"));
    		$("#showOthers", this.el).attr("checked", this.graphModel.get("showOthers"));

    		$(".timeline-value li[data-value='" + this.timelineModel.get("value") + "']", this.el)
			.addClass("active");
	
		$("aside .help", this.el).popover({ offset: 24 });

		return this;
	},
	hide: function() {
		this.graphView.stop();

		$(window).unbind("resize", this._onResize);

		return PageView.prototype.hide.call(this);
	},
	show: function() {
		$(window).bind("resize", this._onResize);
		return PageView.prototype.show.call(this);
	},
	finishedNodesLoading: function() {
		// we have a new set of nodes. Reload the appropriate flows
		this.fetchFlows();
	},
	updateIfLoaded: function() {
		if(!$(this.el).html()) {
			this.render();
		}
    	
		if(this.nodes.length <= 0) {
			$(".btn", this.el).addClass("disabled");
			return this;
		}
    	
		$(".btn", this.el).removeClass("disabled");
    	
		this.loader.hide();
    	
		this.contentScrollApi.reinitialise();
		this.contentScrollApi.scrollToPercentX(0.5);
		this.contentScrollApi.scrollToPercentY(0.5);
    	
		return this;
	},
	fetchNodes: function() {
		var data = {};
		var showOthers = this.graphModel.get("showOthers");
		var nodeLimit = this.graphModel.get("nodeLimit");

		data["sort"] = "flows desc";
		if (!showOthers) {
			// we only have to show the nodes and the flows within the 
			// nodeLimit. So we only have to fetch the nodeLimit nodes with the most
			// flows attached to them.
			data["limit"] = nodeLimit;
		}
		this.nodes.fetch({data : data});
	},
	fetchFlows: function() {
		var interval = this.timelineModel.get("interval");
		var bucket_size = this.timelineModel.get("bucket_size");
		var showOthers = this.graphModel.get("showOthers");
		var nodeLimit = this.graphModel.get("nodeLimit")


		var data = { 
			"fields": FlowInspector.COL_BUCKET,
			"start_bucket": Math.floor(interval[0].getTime() / 1000),
			"end_bucket": Math.floor(interval[1].getTime() / 1000),
			"bucket_size": bucket_size,
			"biflow": 1,
		};
    	
		if (nodeLimit > 0) {
			// we only need to take flows to the top nodes within the nodeLimit
			// into account. So if we have the nodes, we can limit our flow extraction 
			// to them ...
			if (this.nodes.length > 0) {
				var f = "";
				this.nodes.each(function(node) {
					if (f.length > 0) {
						f += ",";
					}
					f += node.id;
				});
				data["include_ips"] = f;
			}
			data["black_others"] = true;
		}

		aggregate_fields =  FlowInspector.COL_SRC_IP + "," + FlowInspector.COL_DST_IP;
		data = FlowInspector.addToFilter(data, this.graphModel, aggregate_fields, true);
		if (data == null) {
			return;
		}

		this.flows.fetch({ data: data });
	},
	changeBucketInterval: function(model, interval) {
		this.loader.show();
		this.fetchFlows();
	},
	clickTimelineValue: function(e) {
		var target = $(e.target).parent();
		this.timelineModel.set({ value: target.data("value") });
	},
	clickLayoutReset: function() {
		if(this.nodes.length <= 0 || this.flows.length <= 0) {
			return;
		}
		this.graphView.forceLayout(true);
	},
	clickLayoutForce: function() {
		if(this.nodes.length <= 0 || this.flows.length <= 0) {
			return;
		}
		this.graphView.forceLayout();
	},
	clickLayoutHilbert: function() {
		if(this.nodes.length <= 0 || this.flows.length <= 0) {
			return;
		}
		this.graphView.hilbertLayout();
	},
	changeNodeLimit: function() {
		this.graphModel.set({
			nodeLimit: Number($("#filterNodeLimit", this.el).val())
		});
	},
	changeTimelineValue: function(model, value) {
		$(".timeline-value li", this.el).removeClass("active");
		$(".timeline-value li[data-value='" + value + "']", this.el)
			.addClass("active");
	},
	nodeLimitChanged: function(model, value) {
		$("#filterNodeLimit", this.el).val(value);
		this.loader.show()
		this.fetchNodes();
	},
	showOthersChanged: function(model, value) {
		$("#showOthers", this.el).attr("checked", value);
		this.loader.show();
		this.fetchNodes();
	},
	changeShowOthers: function() {
		var checkbox = $("#showOthers", this.el);
		var val = false;
		if (checkbox.attr('checked')) {
			val = true;
		}
		this.graphModel.set({
			showOthers: val
		});
	},
	changeFilterProtocols : function(model, value) {
		this.graphModel.set({
			filterProtocols: $("#filterProtocols", this.el).val()
		});
	},
	changeFilterPorts : function(model, value) {
		this.graphModel.set({
			filterPorts: $("#filterPorts", this.el).val()
		});
	},
	changeFilterIPs : function(model, value) {
		this.graphModel.set({
			filterIPs: $("#filterIPs", this.el).val()
		});
	},
	changeFilterPortsType : function(model, value) {
		this.graphModel.set({
			filterPortsType: $("#filterPortsType", this.el).val()
		});
	},
	changeFilterProtocolsType : function(model, value) {
		this.graphModel.set({
			filterProtocolsType: $("#filterProtocolsType", this.el).val()
		});
	},
	changeFilterIPsType : function(model, value) {
		this.graphModel.set({
			filterIPsType: $("#filterIPsType", this.el).val()
		});
	},
	clickApplyFilter : function() {
		this.loader.show();
		this.fetchFlows();
	},
	changeGravity: function() {
		this.graphModel.set({
			gravity: $("#gravity", this.el).val()
		});
		this.graphView.render();
	},
	changeLinkDistance: function() {
		this.graphModel.set({
			linkDistance: $("#linkdistance", this.el).val()
		});
		this.graphView.render();
	},

	changeCharge: function() {
		this.graphModel.set({
			charge: $("#charge", this.el).val()
		});
		this.graphView.render();
	},
});
