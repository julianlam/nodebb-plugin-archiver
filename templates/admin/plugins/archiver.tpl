<div class="row">
	<div class="col-lg-9">
		<div class="panel panel-default">
			<div class="panel-heading">Archiver</div>
			<div class="panel-body">
				<form role="form" class="archiver-settings">
					<fieldset>
						<div class="form-group">
							<label for="active">
								<input type="checkbox" name="active" id="active" />
								Archive Topics
							</label>
						</div>
						<div class="row">
							<div class="form-group col-sm-6">
								<label for="type">Type</label>
								<select class="form-control" name="type" id="type">
									<option value="hard">Hard -- Topics will be archived after the specified # of days</option>
									<option value="activity">Activity -- Topics will be archived after there has been no activity for the specified # of days</option>
								</select>
							</div>
							<div class="form-group col-sm-6">
								<label for="cutoff">Archive topics after this many days</label>
								<input class="form-control" type="number" name="cutoff" id="cutoff" />
							</div>
						</div>
					</fieldset>
				</form>
			</div>
		</div>
	</div>
	<div class="col-lg-3">
		<div class="panel panel-default">
			<div class="panel-heading">Control Panel</div>
			<div class="panel-body">
				<button class="btn btn-primary" id="save">Save Settings</button>
			</div>
		</div>
	</div>
</div>

<script>
	'use strict';
	/* globals require, $, app, socket */

	require(['settings'], function(Settings) {
		Settings.load('archiver', $('.archiver-settings'));

		$('#save').on('click', function() {
			Settings.save('archiver', $('.archiver-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'archiver-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	});
</script>