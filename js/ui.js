function UI(args){
	var ui, connect, drop;

	/* UI
	 * Controller for everything in the UI
	 */
	function UI(args){
		var that = this;

		that.main = args.main;
		that.socket = args.main.socket;

		// Private subcontrollers
		connect = new Connect(that);
		drop = new Drop(that);
	}


	/* Connect
	 *
	 */
	function Connect(ui){
		var that = this;

		that.ui = ui;
		that.socket = ui.socket;

		that.initialize();
	}

	Connect.prototype.initialize = function() {
		var that = this,
			url = $('#url'),
			token = $('#token');

		// Wait until the user has selected a url
		$('#connectButton').click(function(){
			that.socket.connect(url.val() + '?token=' + token.val());
		});
	};


	/* Drop
	 * Handles drag n drop for importing tracks
	 */
	function Drop(ui){
		var that = this;

		that.ui = ui;

		that.initialize();
	}

	Drop.prototype.initialize = function() {
		var that = this,
			drop = $('#dropzone');

		drop.bind('dragenter', handleDragEnter);
		drop.bind('dragover', handleDragOver);
		drop.bind('dragleave', handleDragLeave);
		drop.bind('drop', handleDrop);


		function handleDragEnter(e){
			this.style.background = '#444444';
		}

		function handleDragOver(e){
			e.preventDefault();
			e.originalEvent.dataTransfer.dropEffect = 'copy';
			return false;
		}

		function handleDragLeave(e){
			this.style.background = '#333333';
		}

		function handleDrop(e){
			var text = e.originalEvent.dataTransfer.getData('Text'),
				http = text.split('/'),
				uri = text.split(':'),
				playlist = that.ui.main.playlist,
				models = that.ui.main.models;

			if( (http[5] || uri[1]) === 'playlist' ){
				models.Playlist.fromURI(text, function(tempPlaylist){
					// Load into the app's playlist
					var tracks = tempPlaylist.tracks,
						i;

					for( i = tracks.length; i--; ){
						playlist.add(tracks[i]);
					}
				});
			}
			else if( (http[3] || uri[1]) === 'track' ){
				playlist.add(text);
			}
			else if( (http[3] || uri[1]) === 'album' ){
				models.Album.fromURI(text, function(tempAlbum){
					// Load into the app's playlist
					var tracks = tempAlbum.tracks,
						i;

					for( i = tracks.length; i--; ){
						playlist.add(tracks[i]);
					}
				});
			}
			else if( (http[3] || uri[1]) === 'artist' ){
				models.Artist.fromURI(text, function(tempArtist){
					var search = new models.Search('artist:"' + tempArtist.name + '"');

					search.localResults = models.LOCALSEARCHRESULTS.IGNORE;
					search.searchPlaylists = false;
					search.searchAlbums = false;
					search.pageSize = 5;

					search.observe(models.EVENT.CHANGE, function(result) {
						result.tracks.forEach(function(track){
							playlist.add(track);
						});
					});

					search.appendNext();
				});
			}
			else if( (http[3] || uri[1]) === 'user' ){
				var toplist = new models.Toplist();
				toplist.username = text;

				toplist.observe(models.EVENT.CHANGE, function() {
					toplist.results.forEach(function(track) {
						playlist.add(track);
					});
				});

				toplist.run();
			}

			this.style.background = '#333333';
		}
	};


	ui = new UI(args);
	return ui;
}