<settings-collection>
	<form if={ config } onsubmit={ save }>
		<div class="field">
			<label for="art_pattern">Album art pattern</label><input type="text" id="art_pattern" value={ config.album_art_pattern } oninput={ onPatternInput } placeholder="Folder.(jpg|png)"/>
			<p class="tip">The regular expression used to detect album art files.</p>
			<p if={ !isPatternValid( config.album_art_pattern ) } class="tip error">Please enter a valid regular expression.</p>
		</div>
		<div class="field sources">
			<label>Music sources</label>
			<table class="mount_points">
				<thead>
					<th>Location</th>
					<th class="name">Name</th>
					<th/>
				</thead>
				<tr each={ mountPoint in mountPoints }>
					<td><input type="text" value={ mountPoint.source } oninput={ onPathInput } /></td>
					<td class="name"><input type="text" value={ mountPoint.name } oninput={ onNameInput }/></td>
					<td><i onClick={ deleteMountPoint } class="noselect material-icons md-18">delete</i></td>
				</tr>
			</table>
			<button onClick={ addSource }>Add more</button>
		</div>
		<div class="field sleep_duration">
			<label for="sleep_duration">Delay between collection re-scans</label>
			<input type="text" id="sleep_duration" value={ Math.round(config.reindex_every_n_seconds / 60) } oninput={ onSleepInput } placeholder=""/> minutes
		</div>
		<settings-apply disabled={ !isPatternValid( config.album_art_pattern ) } onclick={ save }/>
	</form>

	<script>

		var self = this;
		this.config = null;
		this.mountPoints = null;

		this.on('mount', function() {
			fetch("api/settings/", { credentials: "same-origin" })
			.then(function(res) { return res.json(); })
			.then(function(data) {
				this.config = data;
				this.mountPoints = data.mount_dirs;
				this.update();
			}.bind(self));
		});

		isPatternValid(pattern) {
			try {
				var re = new RegExp(pattern);
				return true;
			} catch(e) {
				return false;
			}
		}

		onPatternInput(e) {
			this.config.album_art_pattern = e.target.value;
		}

		onSleepInput(e) {
			var newDuration = Math.round(e.target.value) * 60;
			if (isNaN(newDuration) || newDuration < 0) {
				newDuration = 0;
			}
			e.target.value = newDuration / 60;
			this.config.reindex_every_n_seconds = newDuration * 1;
		}

		onPathInput(e) {
			e.item.mountPoint.source = e.target.value;
		}

		onNameInput(e) {
			e.item.mountPoint.name = e.target.value;
		}

		addSource(e) {
			e.preventDefault();
			this.mountPoints.push({});
		}

		deleteMountPoint(e) {
			e.stopPropagation();
			if (this.mountPoints.length == 1) {
				this.mountPoints = [{}];
			} else {
				var mountPointIndex = this.mountPoints.indexOf(e.item.mountPoint);
				if (mountPointIndex >= 0) {
					this.mountPoints.splice(mountPointIndex, 1);
				}
			}
		}

		save(e) {
			e.preventDefault();
			eventBus.trigger("settings:submit", this.config);
		}
	</script>

	<style>
		.sleep_duration input {
			display: inline;
			width: 50px;
			text-align: right;
		}
	</style>

</settings-collection>