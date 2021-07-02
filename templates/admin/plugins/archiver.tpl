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

						<hr />

						<div class="row">
							<div class="form-group col-sm-6">
								<div class="form-group">
									<label for="type">Type</label>
									<select class="form-control" name="type" id="type">
										<option value="hard">Hard -- Topics will be archived after the specified # of days</option>
										<option value="activity">Activity -- Topics will be archived after there has been no activity for the specified # of days</option>
									</select>
								</div>
								<div class="form-group">
									<label for="cutoff">Archive topics after this many days</label>
									<input class="form-control" type="number" name="cutoff" id="cutoff" />
								</div>
								<div class="form-group">
									<label for="cids">Limit archival to the following categories</label>
									<select class="form-control" name="cids" id="cids" multiple="true">
										<!-- BEGIN categories -->
										<option value="{../cid}">{../name} (cid: {../cid})</option>
										<!-- END -->
									</select>
								</div>
								<div class="checkbox">
									<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
										<input class="mdl-switch__input" type="checkbox" name="excludePins">
										<span class="mdl-switch__label">Exclude pinned topics</span>
									</label>
								</div>
							</div>
							<div class="form-group col-sm-6">
								<div class="form-group">
									<label for="action">Action</label>
									<select class="form-control" name="action" id="action">
										<option value="lock">Lock (default) &mdash; Topics will be locked</option>
										<option value="delete">Delete &mdash; Topics will be soft deleted</option>
										<option value="purge">Purge &mdash; Topics will be deleted and removed from the database (irreversible!)</option>
									</select>
								</div>
								<div class="form-group">
									<label for="uid">Act as uid...</label>
									<input class="form-control" type="number" name="uid" id="uid" placeholder="1" />
									<p class="help-block">
										By default this plugin will try to lock topics as uid 1. However, that user
										may not be an administrative user (or even exist), in which case an alternative
										uid of an administrative user should be supplied here.
									</p>
								</div>
								<div class="form-group">
									<label for="lowerBound">Lower bound for capturing topics</label>
									<input class="form-control" type="number" name="lowerBound" id="lowerBound" />
									<p class="help-block">
										This value is automatically updated every time the archiver is run. It is necessary
										so that a subset of topics are scanned/locked every invocation of the archiver.
										Otherwise, the larger the dataset, the more topics are scanned (or in many cases,
										re-scanned) unnecessarily. To instruct the archiver to scan all topics, change this
										value back to zero.
									</p>
								</div>
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
				<div class="btn-block btn-group-vertical">
					<button class="btn btn-primary" id="save"><i class="fa fa-save"></i> Save Settings</button>
					<button class="btn btn-warning" id="execute"><i class="fa fa-trash"></i> Run Archiver</button>
					<button class="btn btn-default" id="test"><i class="fa fa-check-circle-o"></i>Test Run</button>
				</div>
			</div>
		</div>
	</div>
</div>