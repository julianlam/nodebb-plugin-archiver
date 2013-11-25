<h1>Archiver</h1>

<form class="form">
	<fieldset>
		<div class="form-group">
			<label for="active">
				<input type="checkbox" data-field="archiver:active" id="active" />
				Archive Topics
			</label>
		</div>
		<div class="form-group">
			<label for="active">Type</label>
			<select class="form-control" data-field="archiver:type">
				<option value="hard">Hard -- Topics will be archived after the specified # of days</option>
				<option value="activity">Activity -- Topics will be archived after there has been no activity for the specified # of days</option>
			</select>
		</div>
		<div class="form-group">
			<label for="active">Archive topics after this many days</label>
			<input class="form-control" type="number" data-field="archiver:cutoff" />
		</div>

		<button class="btn btn-lg btn-primary" id="save">Save</button>
</form>

<script type="text/javascript">
	require(['forum/admin/settings'], function(Settings) {
		Settings.prepare();
	});
</script>