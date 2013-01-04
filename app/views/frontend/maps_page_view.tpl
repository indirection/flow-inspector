<script type="text/template" id="maps-page-template">
	<div class="container-fixed page-dashboard" style="background-color: #fff;">
		<aside id="sidebar" class="well">
			<h5>Filters</h5>
		    	<p>
		    		<a class="btn enabled apply-filter help" 
		    			href="javascript:void(0)"
		    			title="Apply Filter" 
		    			data-content="Applies the filters defined in the fields below.">
		    			Apply Filter</a>
		    	</p>
	    		<form class="form-stacked">
				<fieldset>
					<div class="clearfix help"
					title="Protocol"
	    				data-content="Filter for protocols. Enter one protocol per line. Supported Protocols: tcp, udp, icmp, other">
						<label for="filterProtocols">Protocol</label>
						<textarea id="filterProtocols" rows="10"></textarea>
						<div class="clearfix">
							<select id="filterProtocolsType">
								<option value="inclusive">include listed protocols</option>
								<option value="exclusive">exclude listed protocols</option>
							</select>
						</div>
					</div>
					<div class="help"
						title="Port filter"
						data-content="Filter flows by port numbers. Enter one port number per line. Ports can be included in the visualization which means only the listed ports will be shown. Or they can be excluded which means only flows that don't contain such a port number are shown.">
						<div class="clearfix">
							<label for="filterPorts">Ports</label>
							<textarea id="filterPorts" rows="10"></textarea>
						</div>
						<div class="clearfix">
							<select id="filterPortsType">
								<option value="inclusive">include only listed ports</option>
								<option value="exclusive">exclude listed ports</option>
							</select>
						</div>
					</div>
					<div class="help"
						title="IP address filter"
						data-content="Filter flows and node lists by IP addresses. Enter one IP address per line (no subnets are allowed at the moment). Addresses can be included in the visualization which means only the listed addresses will be shown. Or they can e excluded which means only flows that don't contain that address are shown.">
						<div class="clearfix">
							<label for="filterIPs">IP Addresses</label>
							<textarea id="filterIPs" rows="10"></textarea>
						</div>
						<div class="clearfix">
							<select id="filterIPsType">
								<option value="inclusive">include only listed IPs</option>
								<option value="exclusive">exclude listed IPs</option>
							</select>
						</div>
				</fieldset>
			</form>
		</aside>
		<div class="content">
			<div class="page-header">
				<h1>Google Maps View</h1>
			</div>
			<ul class="pills hostview-value">
				<li data-value="flows"><a href="javascript:void(0)">Flows</a></li>
				<li data-value="packetDeltaCount"><a href="javascript:void(0)">Packets</a></li>
				<li data-value="octetDeltaCount"><a href="javascript:void(0)">Bytes</a></li>
			</ul>
			<div class="viz-hostview"></div>

			<div class="viz-mapview">
				<div id="map_canvas" style="width:800px; height:800px; center"></div>
			</div>
		</div>
		<footer id="footbar" class="well"> 
			<ul class="pills timeline-value">
				<li data-value="flows"><a href="javascript:void(0)"># Flows</a></li>
				<li data-value="packetDeltaCount"><a href="javascript:void(0)"># Packets</a></li>
				<li data-value="octetDeltaCount"><a href="javascript:void(0)"># Bytes</a></li>
			</ul>
		</footer>
	</div>
</script>
