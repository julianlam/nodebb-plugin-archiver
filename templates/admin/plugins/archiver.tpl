<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="archiver-settings">
				<div class="mb-4">
					<h5 class="fw-bold tracking-tight settings-header">Operations</h5>

					<div class="form-check form-switch my-3">
						<input type="checkbox" class="form-check-input" id="active" name="active">
						<label for="active" class="form-check-label">Archive Topics</label>
					</div>

					<div class="btn-group">
						<button type="button" class="btn btn-warning" id="execute"><i class="fa fa-trash"></i> Run Archiver</button>
						<button type="button" class="btn btn-default" id="test"><i class="fa fa-check-circle-o"></i>Test Run</button>
					</div>
				</div>

				<div class="mb-4">
					<h5 class="fw-bold tracking-tight settings-header">General</h5>

					<!-- <p class="lead">
						Adjust these settings. You can then retrieve these settings in code via:
						<br/><code>await meta.settings.get('quickstart');</code>
					</p> -->
					<div class="mb-3">
						<label class="form-label" for="type">Type</label>
						<select class="form-control" name="type" id="type">
							<option value="hard">Hard -- Topics will be archived after the specified # of days</option>
							<option value="activity">Activity -- Topics will be archived after there has been no activity for the specified # of days</option>
						</select>
					</div>

					<div class="mb-3">
						<label class="form-label" for="cids">Limit archival to the following categories</label>
						<select class="form-control" name="cids" id="cids" multiple="true">
							<!-- BEGIN categories -->
							<option value="{../cid}">{../name} (cid: {../cid})</option>
							<!-- END -->
						</select>
					</div>

					<div class="mb-3">
						<label class="form-label" for="cutoff">Archive topics after this many days</label>
						<input type="number" id="cutoff" name="cutoff" class="form-control">
					</div>

					<div class="form-check form-switch">
						<input type="checkbox" class="form-check-input" id="excludePins" name="excludePins">
						<label for="excludePins" class="form-check-label">Exclude pinned topics</label>
					</div>
				</div>

				<div class="mb-4">
					<h5 class="fw-bold tracking-tight settings-header">Tweaks</h5>

					<div class="mb-3">
						<label for="action">Action</label>
						<select class="form-control" name="action" id="action">
							<option value="lock">Lock (default) &mdash; Topics will be locked</option>
							<option value="delete">Delete &mdash; Topics will be soft deleted</option>
							<option value="purge">Purge &mdash; Topics will be deleted and removed from the database (irreversible!)</option>
						</select>
					</div>
					<div class="mb-3">
						<label for="uid">Act as uid...</label>
						<input class="form-control" type="number" name="uid" id="uid" placeholder="1" />
						<p class="form-text">
							By default this plugin will try to lock topics as uid 1. However, that user
							may not be an administrative user (or even exist), in which case an alternative
							uid of an administrative user should be supplied here.
						</p>
					</div>
					<div class="mb-3">
						<label for="lowerBound">Lower bound for capturing topics</label>
						<input class="form-control" type="number" name="lowerBound" id="lowerBound" />
						<p class="form-text">
							This value is automatically updated every time the archiver is run. It is necessary
							so that a subset of topics are scanned/locked every invocation of the archiver.
							Otherwise, the larger the dataset, the more topics are scanned (or in many cases,
							re-scanned) unnecessarily. To instruct the archiver to scan all topics, change this
							value back to zero.
						</p>
					</div>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
