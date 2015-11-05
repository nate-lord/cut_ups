$( function() {
	var CUT_UPS,
			F,
			S,
			u = undefined;
			
	CUT_UPS = {
		
		settings: {
			$articleBeforeInsertion: u,
			baseStyle: {
				fgColor: 'white',
				name: 'Palatino',
				size: 18,
				color: '000000',
				bold: false,
				italic: false
			},
			baseUrl: 'http://localhost:8888/cut_ups/',
			cachedScrollPos: 0,
			change: 'change',
			click: 'click',
			deletedSection: {
				$article: u,
				$footer: u
			},
			focus: 'focus',
			isMoz: navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
			isSplash: $('html').hasClass('splashPage'),
			keyDown: 'keydown',
			keyPress: 'keypress',
			keyUp: 'keyup',
			makeProject: true,
			mouseDown: 'mousedown',
			mouseEnter: 'mouseenter',
			mouseLeave: 'mouseleave',
			mouseUp: 'mouseup',
			newDocLocation: '',
			notSavedText: ' — not saved',
			pathToRoot: ($('html').hasClass('editorPage') ? '../' : ''),
			Quills: {},
			resize: 'resize',
			saved: true,
			scroll: 'scroll',
			unfocus: 'blur',
			formTextInputHasFocus: false
		},

		funcs: {
			
			addCustomScroll: function() {
				/**
				* adds the custom scroll plugin to the input srcs in the drop down form doc
				*
				* @group: : form doc
				*/
				
				$( '.publishedTextSrc, .inputTextSrc' ).mCustomScrollbar({
					scrollbarPosition: 'outside',
					scrollInertia: 0,
				});
			},

			bindUiActions: function() {
				/**
				* bind the vast majority of ui actions all upfront.
				*
				* @group : init
				*/
				
				$( window ).on( 'load', function() {
					/**
					* prevents css transforms from flash appearing on load.
					* 
					* @group : page load
					* @page : both
					*/
					
					$( 'body' ).removeClass( 'loading' );
				});
				
				$( 'html' ).on( S.mouseEnter, '.inputTextSrc', function() {
					/**
					* focuses text box on mouse enter in the drop down doc form.
					* 
					* @group : form doc
					* @page : both
					*/
					var $editable = $( this ).find( '.editable' );
					
					if ( $editable.is( ':focus' ) === false ) {
						$editable.focus();
						S.formTextInputHasFocus = true;
					}
				});
				
				$( window ).on( S.scroll, function() {
					/**
					* unfocuses text box on mouse enter in the drop down doc form.
					* 
					* @group : form doc
					* @page : both
					*/
					
					// $( this ).find( '.editable' ).blur();
					if ( S.formTextInputHasFocus ) {
						$( '#documentForm' )
							.find( '.editable' )
								.blur();
								
						S.formTextInputHasFocus = false;
					}
				});
				
				$( 'html' ).on( S.click, 'article.default .inputTextSrc', function() {
					/**
					* opens the text box fully in drop down doc form from it's initial state and focuses it.
					* class change causes css animation
					* 
					* @group : form doc 
					* @page : both
					*/
					
					var $wrap =
								$( this )
									.parentsUntil( '.default' )
										.parent()
											.filter( '.documentFormSection' ); // highest level wrap for each of the drop down parts
							
					
					$wrap.removeClass( 'default' )
						.addClass( 'left' );
					
				});
				
				$( '.inputTextSrc' ).on( S.click, function() {
					var $editable = $( this ).find( '.editable' );
					
					if ( $editable.text() === $editable.attr( 'data-original_value' ) ) {
						$editable.html( '<br>' );
					}
					
					$editable.focus();
					S.formTextInputHasFocus = true;
				});
				
				$( 'html' ).on( S.click, 'article.default .publishedTextSrc', function() {
					/**
					* opens the published sources box fully in drop down doc form from it's initial state.
					* class change causes css animation
					* 
					* @group : form doc 
					* @page : both
					*/

					var $wrap = $( this ).parentsUntil( '.default' )
						.parent()
						.filter( '.documentFormSection' ); // highest level wrap for each of the drop down parts
					
					$wrap.removeClass( 'default' )
						.addClass( 'right' );
				});
				
				$( '.textInputBtn, .publishedTextBtn' ).on( S.click, function() {
					/**
					* these are the left and right vertical btns in the drop down form.
					* they toggle the class of their parent which causes a css animation
					* 
					* @group : form doc
					* @page : both
					*/

					var removeClass = [ 'default', 'left', 'right' ],
							$this = $( this ),
							addClass = ( $this.hasClass( 'textInputBtn' ) ? 'left' : 'right' ),
							$section = $this.parents( '.documentFormSection' );

					removeClass.splice( removeClass.indexOf( addClass ), 1 );
					removeClass = removeClass.join( ' ' );
					
					$section.addClass( addClass )
						.removeClass( removeClass );
				});
				
				$( '#save, #saveOnExit' ).on( S.click, function() {
					/**
					* if the global object is not set to saved, call saveDocument.
					* cmd + s triggers this too.
					* 
					* @group : save page
					* @page : editor
					*/
					
					if ( S.saved === false ) {
						F.saveDocument();
					}
				});
				
				$( 'html' ).on( S.click, '.makeDoc', function() {
					/**
					* essamble objects that will be sent to server
					* only get what info is neccassry to make the doc or page before sending it
					* 
					* @group : make doc
					* @page : editor
					*/
					
					var docParams = {
								firstSourceType: '', // published || text input
								firstSource: '', // the content
								secondSourceType: '',
								secondSource: '',
								path: '', // ?
								newDocLocation: S.newDocLocation // new tab || same page
							}, // everything necessary to make a new page
							projectParams = {
								makeProject: S.makeProject, // yup || nope
								amInSubDir: true, // in splash or not
								title: '',
								password: ''
							}, // extra stuff to make new doc
							$titleInput = $( '#titleInput' ), // title from drop down form
							$passwordInput = $( '#passwordInput' ), // password from drop down form
							$src1, // .documentFormSection highest level wrap for each of the drop down parts
							$src2,
							$textInput, // text box from drop down form
							$publishedSrc;
					
					// set project params
					
					projectParams.amInSubDir = ( F.getCurrentSubDir() !== 'cut_ups' ? true : false );
					projectParams.title = ( $titleInput.val() !== $titleInput.data( 'original_value' ) ? $titleInput.val() : 'Untitled' );
					projectParams.password = ( $passwordInput.val() !== $passwordInput.data( 'original_value' ) ? $passwordInput.val() : '' );
					
					// get first source meta data
					
					$src1 = $( '#src1' ).parent();
					
					if ( $src1.hasClass( 'left' ) ) {
						docParams.firstSourceType = 'input';
					} else if ( $src1.hasClass( 'right' ) ) {
						docParams.firstSourceType = 'published';
					}
					
					// get second source meta data
					
					$src2 = $( '#src2' ).parent();
					
					if ( $src2.hasClass( 'left' ) ) {
						docParams.secondSourceType = 'input';
					} else if ( $src2.hasClass( 'right' ) ) {
						docParams.secondSourceType = 'published';
					}
					
					// user selected nothing but make doc. send to server. will make a blank doc.
					
					if ( docParams.firstSourceType === '' && docParams.secondSourceType === '' ) {
						F.makeDocument( docParams, projectParams );
						return;
					}
					
					// get first source content
					
					if ( docParams.firstSourceType === 'input' ) {
						$textInput = $src1.find( '.editable' );
						docParams.firstSource = ( $.trim( $textInput.text() ) !== $textInput.data( 'original_value' ) ?  $.trim( $textInput.text() ) : '' );
					} else if ( docParams.firstSourceType === 'published' ) {
						$publishedSrc = $src1.find( $( 'input:checked' ) ).next().data( 'filename' );
						docParams.firstSource = ( $publishedSrc !== 'nope' ? $publishedSrc : '' );
					}
					
					// get second source content
					
					if ( docParams.secondSourceType === 'input' ) {
						$textInput = $src2.find( '.editable' );
						docParams.secondSource = ( $.trim( $textInput.text() ) !== $textInput.data( 'original_value' ) ?  $.trim( $textInput.text() ) : '' );
					} else if ( docParams.secondSourceType === 'published' ) {
						$publishedSrc = $src2.find( $( 'input:checked' ) ).next().data( 'filename' );
						docParams.secondSource = ( $publishedSrc !== 'nope' ? $publishedSrc : '' );
					}
					
					// send to server
					
					F.makeDocument( docParams, projectParams );
				});
				
				$( '#newDocument' ).on( S.click, function() {
					/**
					* the btn this has into if it creates a new doc || page.
					* launchCreate lowers doc form
					* 
					* @group : form doc / make doc
					* @page : both
					*/
					
					F.launchCreate( $( this ) );
				});
				
				$( 'html' ).on( S.click, '.launchCreate', function() {
					/**
					* the btn this has into if it creates a new doc || page.
					* launchCreate lowers doc form
					* 
					* @group : form doc / make doc
					* @page : both
					*/
					
					F.launchCreate( $( this ) );
				});
				
				$( '.textInput' ).on( S.focus, function() {
					/**
					* handles the unique styling of the drop down doc's title & password inputs:
					* the black bg, blinking text and password hiding
					* 
					* @group : form doc
					* @page : both
					*/
					
					var $input = $( this ), // password & title input
							$displayText = $input.next(); // the style span that follows
					
					// if input is focused on and it's the default value remove the text and cause the
					// css blinking cursor animation.
					// if it's the password input add a class to make the text courier new.
					// this will allow it to be aligned with the ••••• that appear on input
					
					if ( $input.val() === $input.data( 'original_value' ) ) {
						$input.val( '' )
							.addClass( 'blinking' );
						$displayText.text( '' );
						
						if ( $input.hasClass( 'passwordInput' ) ) {
							$input.addClass( 'notVisible' );
						}
					}
					
					// add key up listener
					// if on key up the input is empty, add the blinking animation otherwise remove it
					// it if's not the password simply display the text
					// if it is add the • for every letter to the style span that follows

					$input.on( S.keyUp, function() {
						var val = $input.val(),
								i = 0,
								l = val.length, // text length
								passwordMask = ''; // the •••••
								
						if ( !l ) {
							$input.addClass( 'blinking' );
						} else {
							$input.removeClass( 'blinking' );
						}
						
						if( !$input.hasClass( 'passwordInput' ) ) {
							$displayText.text( val );
						} else {
							for ( i; i < l; i = i + 1 ) {
								passwordMask = passwordMask + '•';
							}
							$displayText.text( passwordMask );
						}
					});
				});
				
				$( '.textInput' ).on( S.unfocus, function() {
					/**
					* removes the focus style & if it's empty repopulate w default value
					* 
					* @group : form doc
					* @page : both
					*/
					
					var $input = $( this ), // password & title input
							originalVal, // the default val
							val = $.trim( $input.val() );
							
					$input.off( S.keyUp )
						.removeClass( 'blinking' );
						
					if ( !val ) {
						originalVal = $input.data( 'original_value' );
						$input.val( originalVal );
						$input.next().text( originalVal );
					}
				});
				
				$( 'html' ).on( S.click, '.hideCreate, .makeDoc', function() {
					/**
					* calls hideCreateDocForm which animates up the doc form.
					* 
					* @group : form doc
					* @page : both
					*/
					
					F.hideCreateDocForm();
				});
				
				$( '#toggleTextSrcs' ).on( S.change, function() {
					/**
					* class change adds backgound color to text author spans
					* 
					* @group : editor
					* @page : editor
					*/
					if ( this.checked ) {
						$( 'body' ).addClass( 'showTextSrcs' );
					} else {
						$( 'body' ).removeClass( 'showTextSrcs' );
					}
				});
				
				$( 'html' ).on( S.click, '.unlocked #toggleLock', function() {
					/**
					* calls lock page
					* 
					* @group : lock page
					* @page : editor
					*/
					F.lockPage();
				});
				
				$( 'html' ).on( S.click, '.locked #toggleLock', function() {
					/**
					* shows / hides the password input to unlock the page
					* 
					* @group : lock page
					* @page : editor
					*/
					F.togglePasswordVisiblity();
				});
				
				$( 'html' ).on( S.focus, '.locked .open #unlockPasswordInput', function() {
					/**
					* on focus a listener is add to detect a return / enter key
					* if it does it will simulate a click which will
					* send the input val to tryToUnlock
					* 
					* @group : lock page
					* @page : editor
					*/
					$( '#unlockPasswordInput' ).on( S.keyDown, function( e ) {
						if ( e.keyCode === 13 ) {
							$( '.locked .open #unlockPassword' ).trigger( S.click );
						}
					});
				});
				
				$( 'html' ).on( S.click, '.locked .open #unlockPassword', function() {
					/**
					* sends the password input val to tryToUnlock.
					* 
					* @group : lock page
					* @page : editor
					*/
					F.tryToUnlock( $( '#unlockPasswordInput' ).val() );
				});
				
				$( 'html' ).on( S.focus, '.inputError #unlockPasswordInput', function() {
					/**
					* removes the 'X' that appears when user puts in a bad password.
					* 
					* @group : lock page
					* @page : editor
					*/
					$( '#unlockPasswordInputWrap' ).removeClass( 'inputError' );
					$( this ).val( '' );
				});
				
				$( 'html' ).on( S.keyDown, '.inputError #unlockPasswordInput', function( e ) {
					/**
					* removes the 'X' that appears when user puts in a bad password.
					* 
					* @group : lock page
					* @page : editor
					*/
					e.preventDefault();
					$( '#unlockPasswordInputWrap' ).removeClass( 'inputError' );
					$( this ).val( '' );
				});
				
				$( 'html' ).on( 'mouseup', '.ql-format-button, .ql-picker-item', function() {
					var scrollY = window.scrollY;
					
					$( window ).on( S.scroll, function() {
						window.scroll( 0, scrollY );
						
						$( window ).off( S.scroll );
					} );
				} );
				

				
				// WORKS, COMMENTED FOR EASE OF EDITING CODE
				/*
				window.onbeforeunload = function( e ) {
				/*
					/**
					* creates a dom alert box warning the user that their page is unsaved when they try to nav away.
					* 
					* @group : save page
					* @page : editor
					*/
				/*
					if( !S.saved ){
						return 'You are exiting before saving.\n\nUnsaved edits will be lost.\n\n';
					}
				};
				*/
				
				$( '#deleteProject' ).on( S.click, function() {
					/**
					* shows the delete project confirm / warning pop up.
					* 
					* @group : pop ups
					* @page : editor
					*/
					
					F.showPopUp( 'delete project' );
				});
				
				$( 'html' ).on( S.click, '.deletePrevDoc', function() {
					/**
					* this reveals one of two pop ups.
					* if there is only 1 page in the doc it shows the warn / confirm destroy project pop up.
					* otherwise it shows the warn / confirm destroy only this one page in the doc pop up.
					* 
					* @group : pop ups
					* @page : editor
					*/
					
					var $this = $( this );
					
					if ( $( '.deletePrevDoc' ).length === 1 ) {
						F.showPopUp( 'delete project' );
					} else {
						S.deletedSection.$footer = $this.parent();
						S.deletedSection.$article = S.deletedSection.$footer.prev();
						F.showPopUp( 'delete section' );
					}
				});
				
				$( '#denyTrashWholeDoc, #denyTrashDocPiece, #newDocLink' ).on( S.click, function() {
					/**
					* hides the currently visible pop up.
					* 
					* @group : pop ups / new doc
					* @page : editor
					*/
					
					F.hidePopUp();
				});
				
				$( '#download' ).on( S.click, function() {
					/**
					* makes the Doc object via prepareDoc.
					* sends that object to the server where a .doc will be made via downloadDoc.
					* 
					* @group : download doc
					* @page : editor
					*/
					
					var Doc = F.prepareDoc(); // the Doc object containing all the heirarchies, text and their styles
					
					F.downloadDoc( Doc );
				});
				
				$( window ).on( S.keyPress, function( e ) {
					/**
					* if cmd + s are pressed prevent 's' from appear in text.
					* trigger click of #save btn which will in turn call saveDocument.
					* 
					* @calls : saveDocument
					* @group : save page
					* @page : editor
					*/
					
					var letter; // the letter pressed on the keypress
					
					if ( S.isSplash ) {
						return;
					}
					
					letter = String.fromCharCode( e.which ).toLowerCase();
					
					if ( e.ctrlKey || e.metaKey && letter === 's' ) {
						e.preventDefault();
						$( '#save' ).trigger( S.click );
					}
				});
				
				$( '#confirmTrashDocPiece' ).on( S.click, function() {
					/**
					* triggered on a pop up if user has > 1 pages in doc.
					* deletes a page.
					* 
					* @calls : deleteSection
					* @group : delete
					* @page : editor
					*/
					
					F.deleteSection();
				});
				
				$( '#confirmTrashWholeDoc' ).on( S.click, function() {
					/**
					* triggered on a pop up if user initally clicked #deleteProject.
					* deletes the whole project.
					* 
					* @calls : deleteDocument
					* @group : delete
					* @page : editor
					*/
					
					F.deleteDocument();
				});
				
				
				$( '#showToolbar' ).on( S.mouseEnter, function() {
					/**
					* there are as many toolbars as there are editor boxes.
					* this hides the show toolbar btn then makes visible the toolbar tied to the currently selected editor box
					* 
					* @group : editor
					* @page : editor
					*/
					
					$( this ).addClass( 'notVisible' );
					$( '.toolbar.selected' ).addClass( 'visible' );
				});
				
				
				$( '#showToolbar' ).on( S.click, function( e ) {
					/**
					* there are as many toolbars as there are editor boxes.
					* this hides the show toolbar btn then makes visible the toolbar tied to the currently selected editor box.
					* it's added for the sake of those w out enter / exit
					* stopPropagation bc if the toolbar is visible and you click somewhere else it will close.
					* stopPropagation prevents it from opening then immediately closing.
					* 
					* @group : editor
					* @page : editor
					*/
					
					$( this ).addClass( 'notVisible' );
					
					$( '.toolbar.selected' ).addClass( 'visible' );
					
					e.stopPropagation();
				});
				
				$( '#editor' ).on( S.click, '.toolbar.selected', function( e ) {
					/**
					* there's a click ev on the body to hide the toolbar on click.
					* stopPropagation prevents that when clicking on the the toolbar itself.
					* 
					* @group : editor
					* @page : editor
					* @see : click ev on body
					*/
					
					e.stopPropagation();
				});
				
				$( 'body' ).on( S.click, function() {
					/**
					* closes the toolbar if open; any menus in the toolbar; the file menu.
					* 
					* @group : editor
					* @page : editor
					*/
					
					var $toolbar = $( '.ql-toolbar.visible' ); // the currently selected toolbar
					
					$toolbar.removeClass( 'visible' );
					
					$toolbar.find( '.ql-expanded' ).removeClass( 'ql-expanded' );
					
					$( '#showToolbar' ).removeClass( 'notVisible' );
					
					$( '#fileMenu' ).removeClass( 'open' )
						.addClass( 'closed' )
						.removeAttr( 'style' );
				});
				
				
				$( '#editor' ).on( S.mouseLeave, '.toolbar.selected', function() {
					/**
					* when you mouse off of the toolbar it hides.
					* 
					* @group : editor
					* @page : editor
					*/
					
					var $toolbar = $( this ); // the currently selected toolbar
					
					$toolbar.removeClass( 'visible' );
					$toolbar.find( '.ql-expanded' ).removeClass( 'ql-expanded ');
					$( '#showToolbar' ).removeClass( 'notVisible' );
				});
				
				
				$( '#editor' ).on( S.focus, '.ql-editor', function() {
					/**
					* gets the id from the the focused editor text box
					* uses the id to get it's toolbar
					* toggle the toolbar selection
					*
					* @group : editor
					* @page : editor
					*/
					
					var id; // the date time id shared  w. the text box editor & its toolbar
					
					id = $( this ).parent()
									.parent()
									.attr( 'data-date_time' );
					
					id = '#toolbar-' + ( id !== undefined ? id : 'header' );
					
					$( '.toolbar.selected' ).removeClass( 'selected' )
						.addClass( 'notSelected' );
						
					$( id ).removeClass( 'notSelected' )
						.addClass( 'selected' );
				});
				
				$( '.logo' ).on( S.click, function() {
					/**
					* makes the about page visible
					* 
					* @group : pop ups
					* @page : both
					*/
					
					$( '#aboutPage' ).removeClass( 'notVisible' )
						.addClass( 'visible' )
						.css( 'left', 0 );
				});
				
				$( '.closeAbout' ).on( S.click, function() {
					/**
					* hides the about pop up.
					* it's a css animation so the timeout waits for it to complete b4 removing the pop up.
					* 
					* @group : pop ups
					* @page : both
					*/
					
					var $aboutPage = $( '#aboutPage' );
					
					$aboutPage.removeClass( 'visible' )
						.addClass( 'notVisible' );
						
					setTimeout(
						function() {
							$aboutPage.css( 'left', '-150%' );
						},
					400 );
				});
				
				$( '.closeInstructions' ).on( S.click, function() {
					/**
					* hides the about pop up.
					* it's a css animation so the timeout waits for it to complete b4 removing the pop up.
					* send the info that it's been to server so it won't appear next time.
					* 
					* @group : pop ups
					* @page : editor
					*/
					
					var $editorInstructions = $( '#instructionsPage' ),
							dir = F.getCurrentSubDir();
							
					$editorInstructions.addClass( 'notVisible' );
					
					setTimeout(
						function() {
							$editorInstructions.remove();
							$( 'body' ).removeClass( 'noScroll' );
						},
					400 );
					
					$.ajax({
						type: 'POST',
						url: S.pathToRoot + 'functions.php',
						data: {
							action: 'update_editor_instructions',
							dir: dir
						},
						success: function( data ) {
							// ? remove
						}
					});
				});
				
				$( '#fileMenu' ).on( S.click, function( e ) {
					/**
					* toggles open / close file menu.
					* keeps it open.
					* stopPropagation bc body has a click ev on it to shut menus.
					* 
					* @group : editor
					* @page : editor
					*/
					
					var $fileMenu = $( this ),
							isOpen = $fileMenu.hasClass( 'open' );
							
					e.stopPropagation();
							
					$fileMenu.addClass( ( isOpen ? 'closed' : 'open' ) )
						.removeClass( ( isOpen ? 'open' : 'closed' ) )
						.removeAttr( 'style' );
				});
				
				$( '#fileMenu' ).on( S.mouseEnter, function() {
					/**
					* opens menu if page is not locked.
					* 
					* @group : editor
					* @page : editor
					*/
					
					var $fileMenu = $( this ),
							isLocked = $( 'body' ).hasClass( 'locked' );
					
					if ( !isLocked ) {
						$fileMenu.css( 'height', '15.5rem' );
					}
				});
				
				$( '#fileMenu' ).on( S.mouseLeave, function() {
					/**
					* closes menu if page is not locked.
					* 
					* @group : editor
					* @page : editor
					*/
					
					var $fileMenu = $( this ),
							isOpen = $fileMenu.hasClass( 'open' );
					
					if ( !isOpen ) {
						$fileMenu.removeAttr( 'style' );
					}
				});
			},
			
			changeSplashFeatureSlide: function() {
				/**
				* remove the current state from the current slide and adds it to it's next sibling.
				*
				* @group : splash animation
				*/
				
				var $curSlide = $( '.projectFeature.current' ),
						$nextSlide = $curSlide.next();
						
				$curSlide.removeClass( 'current' )
					.addClass( 'notCurrent' );
					
				$nextSlide.removeClass( 'notCurrent' )
					.addClass( 'current' );
			},
			
			componentToHex: function( c ){
				/**
				* takes a r, g, or b value and converts it from an int to a hex string
				*
				*
				* @param {int} c : a rgb componant. ex: 255 becomes FF
				* @return {string} hex
				*/
				
				var hex = c.toString( 16 );
				
				hex = ( hex.length === 1 ? "0" + hex : hex );
				hex = hex.toUpperCase();
				
				return hex;
			},
			
			deleteDocument: function() {
				/**
				* takes the directory name, sends it to the server to be deleted. on success reload page to splash.
				*
				* @group :  delete doc
				*/
				
				var dir = F.getCurrentSubDir();
				
				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'delete_doc',
						dir: dir
					},
				
					success: function( data ) {
						$(' body' ).animate(
							{ opacity: 0 },
							{ duration: 300,
								complete: function(){
									window.location.href = S.baseUrl;
								}
							}
						);
					}
				});
			},
			
			deleteSection: function() {
				/**
				* get the date time from the page to be deleted (called id elsewhere).
				* hide it w css animation
				* remove from page after animation
				* clear it from set of Quills
				* hide the pop up that confirmed action
				* send the date time to server to be removed from the database
				*
				* @group : delete piece
				*/
				
				var date_time = S.deletedSection.$article.data( 'date_time' ) + '';
						
				S.deletedSection.$article.addClass( 'notVisible' );
				
				setTimeout(
					function(){
						delete S[ 'Quills' ][ 'q-' + date_time ];
						delete S[ 'Quills' ][ 'm-' + date_time ];
						
						S.deletedSection.$article.remove();
						S.deletedSection.$footer.remove();
						
						if ( S.saved ) {
							F.makePageUnsaved();
						}
						
						F.hidePopUp();
					},
				300 );
			},
			
			downloadDoc: function( Doc ) {
				/**
				* get the dir so it knows where to add the .doc.
				* send it to the server to get contructed.
				* return the filename of the doc.
				* add it to the iframe w id fileDownloader which will trigger a download.
				*
				* @group : download doc
				*
				* @param {Object} Doc : the object that contains the heirarchies, text and their style
				*/
				
				var dir = F.getCurrentSubDir();

				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'download_doc',
						Doc: Doc,
						dir: dir
					},
				
					success: function( fileName ) {
						$( '#fileDownloader' ).attr( 'src', fileName );
					}
				});
			},
			
			getCurrentSubDir: function() {
				/**
				* gets the current subdirectory
				* take path name (everything after .com)
				*						
				* @group : utility
				*
				* @return {string} pathArray
				*/
				
				var pathArray = window.location.pathname.split( '/' );
				
				pathArray = $.grep( pathArray, function( n ) { return( n ) } );
				
				return pathArray[ pathArray.length - 1 ];
			},
			
			getRandomInt: function( min, max ) {
				/**
				* gets a random num between a min and max.
				*
				* @group : utility / splash animation
				*
				* @param {int} min
				* @param {int} max
				* @return {int}
				*/
				
			  return Math.floor( Math.random() * ( max - min ) ) + min;
			},
			
			givePageParagraphs: function( Page ) {
				/**
				* this is part of the prep to make a .doc
				* this is the function called in a foreach for each page.
				* this takes a object page, which is all the spans and their style attributes (like a rich text doc).
				* it returns a highly modified object page.
				* the object is generated from quill, and you might need to look at it to follow.
				* what this does is takes the spans and makes paragraph blocks out of them.
				* we need to do this bc of the text alignment style in word php which is a paragraph level style.
				* whenever there's a \n as the text we know there's a new paragraph and an end to the previous one.
				*
				* @group : download doc
				*
				* @param {object} Page
				* @return {object} Page
				*/
				
				var i = 0,
						Paragraph,
						Styles,
						Span,
						This,
						l = Page.spanCount,
						paragraphCount = 0,
						spanCount = 0;

				for ( i; i < l; i = i + 1 ) {
					
					// each span object in the object from quill is name 'SpanN' with N being a number 0 and up
					// caches the name for code readability
					
					Span = Page[ 'Span' + i ];
					
					// we put all the spans in each paragraph in a new object 'ParagraphN' with N being paragraphCount which is a number 0 and up
					// paragraphCount increases by 1 whenever a new paragraph is detected
					// this conditional below defines each new paragraph object
					
					Page[ 'Paragraph' + paragraphCount ] = ( Page[ 'Paragraph' + paragraphCount ] === undefined ? {} : Page[ 'Paragraph' + paragraphCount ] );
					
					// caches the name for code readability
					
					Paragraph = Page[ 'Paragraph' + paragraphCount ];
					
					// we add a span object named 'SpanN' to the paragraph object with N being the spanCount
					// whenever a new paragraph the spanCount is reset to 0, otherwise it increase by 1 once each loop
					
					Paragraph[ 'Span' + spanCount ] = {};
					
					// note that we now have two Span objects, one that we are getting info from the other we are setting info to
					
					// add the text string as a member of the new span object
					// add an empty Styles object to it as well
					
					Paragraph[ 'Span' + spanCount ][ 'text' ] = Span.insert;
					Paragraph[ 'Span' + spanCount ][ 'Styles' ] = {};
					
					// caches the name for code readability
					
					Styles = Paragraph[ 'Span' + spanCount ][ 'Styles' ];
					
					// sets the align value on the paragraph object.
					// this is a string value. it can be 'left', 'right', or 'center'
					
					// we have to first check if it's undefined or it will throw an error
					
					if ( Span.attributes !== undefined && Span.attributes.align !== undefined ) {
						Paragraph.align = Span.attributes.align;
					} else {
						Paragraph.align = 'left';
					}
					
					// delete the author info bc we don't use it
					
					if ( Span.attributes !== undefined && Span.attributes.author !== undefined ) {
						delete Span.attributes.author;
					}
					
					// if the span has no attributes, set the base styles,
					// otherwise go one by one checking them.
					// if they have it get it and set it otherwise set the given base style.
					
					if ( Span.attributes === undefined || $.isEmptyObject( Span.attributes ) ) {
						Styles.fgColor = S.baseStyle.fgColor;
						Styles.color = S.baseStyle.color;
						Styles.name = S.baseStyle.name;
						Styles.size = S.baseStyle.size;
						Styles.bold = false;
						Styles.italic = false;
					} else {
						
						// background color. it has to be a color name.
						
						Styles.fgColor = S.baseStyle.fgColor;
						
						// text color. it has to be hex.
						
						Styles.color = S.baseStyle.color;
						
						// type face
						
						if ( Span.attributes.font === undefined || Span.attributes.font === 'serif' ) {
							Styles.name = S.baseStyle.name;
						} else if ( Span.attributes.font === 'monospace' ) {
							Styles.name = 'Lucida Sans Typewriter';
						} else {
							Styles.name = 'Arial';
						}
						
						// type size
						
						if ( Span.attributes.size !== undefined ) {
							Styles.size = Span.attributes.size;
						} else {
							Styles.size = S.baseStyle.size;
						}
						
						// bold status
						
						if ( !Span.attributes.bold ) {
							Styles.bold = false;
						} else {
							Styles.bold = true;
						}
						
						// italic status
						
						if ( !Span.attributes.italic ) {
							Styles.italic = false;
						} else {
							Styles.italic = true;
						}
					}
					
					// this is where we determine if there's a new paragraph
					
					if ( Paragraph[ 'Span' + spanCount ][ 'text' ][ 0 ] === '\n' ) {
						paragraphCount = paragraphCount + 1;
						spanCount = 0;
					} else {
						spanCount = spanCount + 1
					}
					
					// since we're returning the page object, delete the span object we got the info from
					
					delete Page[ 'Span' + i ];
				}
	
				return Page;
			},
			
			hideCreateDocForm: function() {
				/**
				* cache elems you will use.
				* remove the resize and scroll evs on window - prevents any mishap during the animation
				* add data-animatable to the form sections - this instates css animations to work
				* add the css animation inline
				* add the notvisble calss to the form - this hides the 'X' btn thru a css animation
				* clear the createDocument || createProject class which sets if 2 or 3 sections should appear
				* remove the inline style from the formExtender so you won't have extra scrolling white space below the text editor
				* after the css animation occurs ( 800ms ) reset all the forms
				* and remove the ability for css animations to effect it remove any inline css animations.
				*
				* @group : doc form
				*/
				
				var $form = $( '#documentForm' ),
						$formSections = $( '.documentFormSection' ),
						$formExtender = $( '#documentFormExtender' ),
						removeClass = ( $form.hasClass( 'createDocument' ) ? 'createDocument' : 'createProject' ) + ' visible';
				
				$( window ).off( 'resize' )
					.off( 'scroll' );
				
				$formSections.attr( 'data-animatable', 'true' )
					.css({ 'transform': 'translateY(-100%)',
								 'transition-timing-function': 'ease-out',
								 'transition-duration': '500ms' });
				
				$form.addClass( 'notVisible' )
					.removeClass( removeClass );
					
				$formExtender.removeAttr( 'style' );
					
				setTimeout(
					function() {
						$formSections.attr( 'data-animatable', 'false' )
							.removeAttr( 'style' );
						F.resetCreateDocForm();
						
					},
				// 800 is the animation-duration for the drop down of the form
				820 );
			},
			
			hidePopUp: function() {
				/**
				* take currently visible pop up and hide it and it's wrap.
				*
				* @group : pop ups
				*/
				
				$( '#popUps' ).addClass( 'notVisible' )
					.removeClass( 'visible' );
					
				$( '.popUp.visible' ).addClass( 'notVisible' )
					.removeClass( 'visible' );
			},
			
			launchCreate: function( $this ) {
				/**
				* pre-flight for show drop down form doc.
				* sets globals to determine if 2 or 3 sections of the drop down should be shown
				* what kind of thing it will make and where to load it. 
				*
				* @group : doc form
				*
				* @param {jQuery object} $this
				*/
				
				S.doesCreateProject = ( $this.data( 'create_project' ) === 'yup' ? true : false );
				S.makeProject = S.doesCreateProject;
				
				if ( $this.hasClass( 'newDoc' ) ) {
					S.newDocLocation = 'new tab';
				} else if ( $this.hasClass( 'addNextDoc' ) ) {
					S.$articleBeforeInsertion = $this.parent();
					S.newDocLocation = 'same page';
				} else {
					S.newDocLocation = 'same page';
				}
				
				F.showCreateDocForm();
			},
			
			launchShowCloudAnimation: function() {
				/**
				* animation group 5 of 5 of the splash animation.
				* uses svg.js library which has slighty different syntax.
				* where the down / upload cloud appears, disappears, shows looping blinking cursor
				*
				* @group : splash animation
				*/
				
				var $cloudGroup = $( '#cloudGroup' )[ 0 ].instance;
				
				F.changeSplashFeatureSlide();
				
				$cloudGroup.animate( 350, '>' ).y( -10 ).opacity( 1 ).after( function() {
					$cloudGroup.animate( 350, '>', 3000 ).y( 0 ).opacity( 0 );
					
					setTimeout(
						function() {
							F.changeSplashFeatureSlide();
							$( '#splashBlinkingCursor' )[ 0 ].instance.attr( 'class', 'cursor visible animating' );
						},
					5000 );
				});
			},
			
			launchSplashTextMergeAnimation: function() {
				/**
				* animation group 1 of 5 of the splash animation.
				* where the text from the two smaller docs moves into the large one.
				* uses svg.js library which has slighty different syntax.
				*
				* @group : splash animation
				*/
				
				var $cText = $( '#centerPageImg .initTextGroup .text' ),
						$cLeftText = $( '#centerPageImg .text.left' ),
						$cRightText = $( '#centerPageImg .text.right' ),
						dur = 400,
						delayBase = dur / 4,
						i = 0,
						$lText = $( '#leftPageImg .text' ),
						l = $lText.length,
						$rText = $( '#rightPageImg .text' ),
						cL = $cLeftText.length;
						
				for ( i; i < l; i = i + 1 ) {
					$lText.eq( i )[ 0 ].instance.animate( dur, '>', delayBase * i ).x( 100 );
					$rText.eq( i )[ 0 ].instance.animate( dur, '>', delayBase * i ).x( -100 );
					
					if ( i < cL ) {
						$cLeftText.eq( i )[ 0 ].instance.animate( dur, '>', delayBase * i ).x( 118 );
						$cRightText.eq( i )[ 0 ].instance.animate( dur, '>', delayBase * i ).x( 118 );
					}
				}
				
				setTimeout(
					function() {
						F.launchSplashTextTumbleAnimation();
						$( '#leftPageImg' ).addClass( 'notVisible' );
						$( '#rightPageImg' ).addClass( 'notVisible' );
					},
				delayBase * i + 1000 );
			},
			
			launchSplashTextTumbleAnimation: function() {
				/**
				* animation group 2 of 5 of the splash animation.
				* uses svg.js library which has slighty different syntax.
				* where the text falls off the page while rotating
				*
				* @group : splash animation
				*/
				
				var $blinkingCursor = $( '#splashBlinkingCursor' ),
						cnt = 0,
						cx,
						i = 0,
						dur = 1000,
						$texts = $( '#centerPageImg .initTextGroup .text' ),
						l = $texts.length,
						$text,
						w,
						y;
						
				F.changeSplashFeatureSlide();
				
				for ( i; i < l; i = i + 1 ) {
					$text = $texts.eq( i )[ 0 ].instance;
					w = $text.width()
					cx = $text.cx();
					cx = cx + F.getRandomInt( w / -2, w / 2 );
					deg = F.getRandomInt( -90, 90 );
					y = $text.y() + w / 2 + 200;
					$text.animate( dur, '>', dur ).y( y ).rotate( deg, cx, 0 );
				}
				
				setTimeout(
					function() {
						$blinkingCursor[ 0 ].instance.attr( 'class', 'cursor visible animating' );
					},
				dur );
				
				setTimeout(
					function() {
						$blinkingCursor[ 0 ].instance.attr( 'class', 'cursor notVisible notAnimating' );
						F.launchSplashTextWriteAnimation();
					},
				3 * 1250 + dur ); // delay needs to be a multiple of 1250 + dur
			},
			
			launchSplashTextWhiteOutAnimation: function() {
				/**
				* animation group 4 of 5 of the splash animation.
				* uses svg.js library which has slighty different syntax.
				* where parts of the text are erased
				*
				* @group : splash aniamtion
				*/
				
				var $baseTextGroup = $( '#baseTextGroup' ),
						$whiteOutGroup = $( '#whiteOutGroup' ),
						$whiteOuts = $whiteOutGroup.find( '.whiteOut' ),
						$whiteOut,
						allWhiteOutCoords = [],
						thisWhiteOutCoords = [],
						$cursors = $whiteOutGroup.find( '.cursor' ),
						$cursor,
						cursorCoords = [],
						dur = 400,
						delay = 100,
						i = 0,
						l = $whiteOuts.length;
				
				F.changeSplashFeatureSlide();
				
				for ( i; i < l; i = i + 1 ) {
					$whiteOut = $whiteOuts.eq( i );
					
					thisWhiteOutCoords = $whiteOut.data( 'plot_points' ).split( ' ' );
					
					$.each( thisWhiteOutCoords, function( i ) {
						thisWhiteOutCoords[ i ] = parseInt( thisWhiteOutCoords[ i ], 10 );
					});
					
					allWhiteOutCoords.push( [ [ thisWhiteOutCoords[ 0 ], thisWhiteOutCoords[ 1 ] ],
																		[ thisWhiteOutCoords[ 2 ], thisWhiteOutCoords[ 3 ] ],
																		[ thisWhiteOutCoords[ 4 ], thisWhiteOutCoords[ 5 ] ],
																		[ thisWhiteOutCoords[ 6 ], thisWhiteOutCoords[ 7 ] ] ]);
																	 
					cursorCoords.push( parseInt( $cursors.eq( i ).data( 'x' ), 10 ) );
				}
				
				i = 0;
				
				function animateWhiteOut() {
					$cursor = $cursors.eq( i )[ 0 ].instance;
					$whiteOut = $whiteOuts.eq( i )[ 0 ].instance;
					$cursor.opacity( 1 );
					$whiteOut.opacity( 1 );
					$whiteOut.animate( dur, '>', delay ).plot( allWhiteOutCoords[ i ] );
					$cursor.animate( dur, '>', delay ).x( cursorCoords[ i ] ).after( function() {
						$cursor.opacity( 0 );
						i = i + 1;
						if ( i < l ) {
							animateWhiteOut();
						} else {
							setTimeout(
								function() {
									$baseTextGroup = $baseTextGroup[ 0 ].instance;
									$whiteOutGroup = $whiteOutGroup[ 0 ].instance;
									$baseTextGroup.animate( dur, '=', delay ).y( 10 ).opacity( 0 );
									$whiteOutGroup.animate( dur, '=', delay ).y( 10 );
								},
							1000 );

							setTimeout(
								function() {
									F.launchShowCloudAnimation();
								},
							dur + 2000 );
						}
					});
				}
				animateWhiteOut();
			},
			
			launchSplashTextWriteAnimation: function() {
				/**
				* animation group 3 of 5 of the splash animation.
				* uses svg.js library which has slighty different syntax.
				* where the text lines 'write' themselves on from l to r starting at top
				*
				* @group : splash animation
				*/
				
				var $cursor,
						$writeTexts = $( '.writeText' ),
						x,
						i = 0,
						l = $writeTexts.length,
						$group,
						$writeText,
						dur;
						
				for ( i; i < l; i = i + 1 ) {
					$writeText = $writeTexts.eq( i )
					$cursor = $writeText.find( '.cursor' )[ 0 ].instance;
					$group = $writeText[ 0 ].instance;
					x = $writeText.find( '.mask' )[ 0 ].instance.attr( 'width' );
					dur = 4 * x;
					$cursor.animate( 0, '=', i * dur + 200 ).fill( '#000' );
					$group.animate( dur, '=', i * dur + 200 ).x( x ).after( function() {
						this.animate( 0, '=', 200 ).opacity( 0 );
					} );
				}
				
				setTimeout(
					function() {
						F.launchSplashTextWhiteOutAnimation();
					},
				i * dur + 3000 );
			},
			
			lockPage: function() {
				/**
				* toggle the locked class on the body - this will prevent the user from selecting any tools.
				* make the text editor boxes uneditable.
				* update the locked status on the server.
				*
				* @group : lock page
				*/
				
				var dir = F.getCurrentSubDir();
				
				$( 'body' ).removeClass( 'unlocked' )
					.addClass( 'locked' );
					
				$( '.ql-editor, .ql-paste-manager' ).removeAttr( 'contenteditable' );
				
				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'lock_page',
						dir: dir
					}
				});
			},
			
			makeDocument: function( docParams, projectParams ) {
				/**
				* step by step of what goes on.
				*
				* @called : click ev on .makeDoc
				*						
				* @calls : showPopUp,
				*					 makePageUnsaved,
				*					 hidePopUp
				* @group : make new doc
				*
				* @param {object} docParams
				* @param {object} projectParams
				*/
				
				// show spinning cube
				
				F.showPopUp( 'loading' );
				
				// create the doc in the server
				// return the doc
				
				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'make_doc',
						docParams: docParams,
						projectParams: projectParams
					},

					success: function( data ) {
						var $article,
								continuation,
								opacity = 1;
						
						// here we're defining what to do (continuation) after the body animates its opacity
						data = $.parseJSON( data );
						
						// if it's a new project but made from an editor page
						// show pop up with new link bc we can't make a new tab w. js
						
						if ( data.makeProject && data.isInNewTab ) {
							continuation = function() {
								$( '#newDocLink' ).attr( 'href', S.baseUrl + data.href );
								F.showPopUp( 'new doc' );
							};
						}
						
						// a whole new project from splash change current url
						
						if ( data.makeProject && !data.isInNewTab ) {
							opacity = 0;
							continuation = function() {
								window.location.href = data.href;
							};
						}
						
						// if it's a new page 
						
						if ( !data.makeProject ) {
							continuation = function() {
								var $editor = $( data.editor ),
										Q,
										M,
										$articleBody = $editor.filter( '.article' ).find( '.articleBody' ),
										content = $articleBody.html(),
										sourceCount = parseInt( $articleBody.attr( 'data-source_count' ), 10 ),
										id = $editor.filter( '.article' ).attr( 'data-date_time' );
								
								// add editor to the dom
								
								$editor.insertAfter( S.$articleBeforeInsertion );
								
								// empty it so we can add quill
								
								$articleBody.empty();
								
								// update saved status
								
								if ( S.saved ) {
									F.makePageUnsaved();
								}
								
								// make the quill object and add it to the global
								
								S.Quills[ 'q-' + id ]	= new Quill( '#editor-' + id,
									{ theme: 'snow' }
								);
								
								// cache object for code readability
					
								Q = S.Quills[ 'q-' + id ];
								
								// link the toolbar
								
								Q.addModule( 'toolbar', {
								  container: '#toolbar-' + id
								});
								
								// if applicable add the authorship module
								
								if ( sourceCount >= 1 ) {
									S.Quills[ 'm-' + id ] = Q.addModule( 'authorship', {
										authorId: ( 'user-' + id ),
										color: 'rgba(255,255,255,0)'
									});
									
									// cache object for code readability
									
									M = S.Quills[ 'm-' + id ];
									
									// style is over ridden in css
						
									M.addAuthor( ( 'user-archive-' + id ), 'rgba(255,255,255,0)' );
						
									M.addAuthor( ( 'firstSrc-' + id ), 'rgba(255,255,255,0)' );
								}
								
								if ( sourceCount === 2 ) {
									M.addAuthor( ( 'secondSrc-' + id ), 'rgba(255,255,255,0)' );
								}
								
								// enable the style module
								
								if ( sourceCount >= 1 ) {
									M.enable();
								}
								
								// return the content
								
								Q.setHTML( content );
								
								// add listener so page becomes unsaved on change
								
								Q.on( 'text-change', function( delta, source ) {
									if ( source == 'user' ) {
										F.makePageUnsaved( S.Quills.qheader.getText() );
									}
								});
								
								// hide the loading pop up
								
								F.hidePopUp();
							};
						}
						
						$( 'body' )
							.delay( 1000 )
							.animate(
							{ opacity: opacity },
							{ duration: 300,
								complete: function() {
									continuation();
								}
							}
						);
					}
				});
			},
			
			makePageUnsaved: function( title ) {
				/**
				* makes the global saved setting false.
				* updates the <title> text.
				*
				* @group : save doc
				*
				* @param {string} title
				*/
				
				var $title = $( 'title' );
				
				title = ( title === undefined ? $title.text() : title ) + S.notSavedText;
				$title.html( title );
				S.saved = false;
			},
			
			prepareDoc: function() {
				/**
				* the preparation for the Doc object.
				*
				* @called : click ev on #download
				* @calls : givePageParagraphs
				* @group : download doc
				*
				* @return {object} Doc
				*/
				
				var Doc = {},
						Pages = {},
						i = 0,
						memberCount,
						l,
						count = 0;
				
				// get the title for the doc
				
				Doc.title = $( '#articleTitle' ).text();
				
				// loop through the global quill object
				
				for ( var key in S.Quills ) {
				  if ( S.Quills.hasOwnProperty( key ) ) {
						
						// exclude the module objects and the header object
						
						if ( key[ 0 ] + key[ 1 ] === 'q-' ) {
							i = 0;
							
							// get the number of spans
							
							l = S[ 'Quills' ][ key ].getContents().ops.length;
							
							// make a page object for each page
							
							Pages[ 'Page' + count ] = {};
							
							// copy over the span objects
							
							for ( i; i < l; i = i + 1 ) {
								Pages[ 'Page' + count ][ 'Span' + i ] = S[ 'Quills' ][ key ].getContents().ops[ i ];
							}
							Pages[ 'Page' + count ][ 'spanCount' ] = l;
							count = count + 1;
						}
				  }
				}
				
				l = count;
				i = 0;
				
				// modify the doc object
				
				for ( i; i < l; i = i + 1 ) {
					Doc[ 'Page' + i ] = F.givePageParagraphs( Pages[ 'Page' + i ] );
				}
				
				return Doc;
			},
			
			preventDefault: function( e ) {
			  e = e || window.event;
				
			  if ( e.preventDefault ) {
			  	e.preventDefault();
			  }
			  
			  e.returnValue = false;  
			},
			
			resetCreateDocForm: function() {
				/**
				* resets all the values in the doc form.
				* this is split into two functions for readablity:
				* the title / password slide and then the content input slides
				*
				* @group : doc form
				*/
				
				function resetTitleDropDown() {
					var $titleInput = $( '#titleInput' ),
							originalTitle = $titleInput.data( 'original_value' ),
							$copiedTitle = $titleInput.next(),
							$passwordInput = $( '#passwordInput' ),
							originalPassword = $passwordInput.data( 'original_value' ),
							$copiedPassword = $passwordInput.next();
					
					// this is title / password slide reset
					
					// the the password and title both have style spans that follow them
					// that hold the same text.
					// reset both
					
					$titleInput.val( originalTitle );
					$copiedTitle.text( originalTitle );
					$passwordInput.val( originalPassword );
					$copiedPassword.text( originalPassword );
					
				}
				resetTitleDropDown();
				
				function resetSrcDropDown( num ) {
					var $parent = $( '#src' + num ).parent(),
							$inputTextSrc = $parent.find( '.inputTextSrc' ),
							$textInput = $inputTextSrc.find( '.editable' ),
							$publishedTextSrc = $parent.find( '.publishedTextSrc' ),
							$radioBtns = $publishedTextSrc.find( 'input[type="radio"]' );
					
					// return slide btns to middle default state
					
					$parent.removeClass( 'left right' )
						.addClass( 'default' );
					
					// reset text input
					
					$textInput.text( $textInput.data( 'original_value' ) );
					
					// reset the text input custom scroll to the top
					
					$inputTextSrc
						.find( '.mCSB_container' ).css( 'top', '0px' )
						.end()
						.find( '.mCSB_dragger' ).css( 'top', '0px' );
					
					// uncheck the published source inputs
					
					$radioBtns.prop( 'checked', false );
					$radioBtns.eq( 0 ).prop( 'checked', true );
					
					// reset the published source input custom scroll to the top
					
					$publishedTextSrc
						.find( '.mCSB_container' ).css( 'top', '0px' )
						.end()
						.find( '.mCSB_dragger' ).css( 'top', '0px' );
				}
				resetSrcDropDown( 1 );
				resetSrcDropDown( 2 );
			},
			
			revealFormSection: function( percentScrolled, scrollDir ) {
				/**
				* animate-reveal a section
				*
				* @group : doc form
				*
				* @param {int} percentScrolled
				* @param {string} scrollDir
				*/
				
				var scrollY = 0,
						$currentSlide = ( S.doesCreateProject && percentScrolled > 50 ? S.$secondFormSection : S.$firstFormSection );
				
				// in the block below if it is true the slide will move a bit but not trigger the up or down animation
				// this is to show the ability to do so to the user
				
				if ( S.doesCreateProject && percentScrolled <= 8.33333333333338 ) {
					$currentSlide.css( 'transform', 'translateY(' + ( -1 * percentScrolled ) + '%)' );
				} else if ( S.doesCreateProject && percentScrolled >= 41.66666666666662 && percentScrolled <= 50 ) {
					$currentSlide.css( 'transform', 'translateY(' + ( 50 - percentScrolled + -100 ) + '%)' );
				} else if ( S.doesCreateProject && percentScrolled > 50 && percentScrolled <= 58.33333333333338 ) {
					$currentSlide.css( 'transform', 'translateY(' + ( 50 - percentScrolled ) + '%)' );
				} else if ( S.doesCreateProject && percentScrolled >= 91.66666666666662 ) {
					$currentSlide.css( 'transform', 'translateY(' + ( -1 * percentScrolled ) + '%)' );
				} else if ( !S.doesCreateProject && ( percentScrolled < 12.5 || percentScrolled > 87.5 ) ) {
					$currentSlide.css( 'transform', 'translateY(' + ( -1 * percentScrolled ) + '%)' );
				} else {
					
					// an animation will be triggered
					// remove the listener from the window so it won't be re-triggered
					
					$( window ).off( S.scroll, F.revealFormSectionEvent );
					
					// remove the ability for the body to scroll
					
					$( 'body' ).addClass( 'noScroll' );
					
					// going up or down get the scroll position for after the animation.
					// enable the slide to do css animations.
					// trigger the translateY animation.
					
					if ( scrollDir === 'up' ) {
						if ( S.doesCreateProject && percentScrolled > 8.33333333333338 && percentScrolled < 41.66666666666662 ) {
							scrollY = ( $( document ).height() - $( window ).height() ) / 2;
						} else {
							scrollY = $( document ).height() - $( window ).height();
						}
						
						$currentSlide.attr( 'data-animatable', 'true' )
							.css( 'transform', 'translateY(-100%)' );
					}
					
					if ( scrollDir === 'down' ) {
						if ( S.doesCreateProject && percentScrolled > 58.33333333333338 && percentScrolled < 91.66666666666662 ) {
							scrollY = ( $( document ).height() - $( window ).height() ) / 2;
						}
						
						$currentSlide.attr( 'data-animatable', 'true' )
							.css( 'transform', 'translateY(0)' );
					}
					
					// after the css animation remove the animateable ability from the slide
					// allow the body to be scrollable again
					// reposition the scroll bar to the scrollY value
					// re-attach the revealFormSectionEvent listener to the window
					
					setTimeout(
						function() {
							$currentSlide.attr( 'data-animatable', 'false' );
							$( 'body' ).removeClass( 'noScroll' );
							window.scrollTo( 0, scrollY );
							$( window ).on( S.scroll, F.revealFormSectionEvent );
						},
						// 800 is the animation-duration for the form change, 20 to give space for scroll animation
						810
					);
				}
			},
			
			revealFormSectionEvent: function() {
				/**
				* this is a scroll event that is attached to the window.
				* it calculates a number that is a percent w out the '%' and the direction the user is scrolling.
				* it sends that info to revealFormSection to determine what to do w it.
				*
				* @group : doc form
				*/
				
				var $window = $( window ),
						scrollPos = $window.scrollTop(),
						scrollDir = ( S.cachedScrollPos > scrollPos ? 'down' : 'up' ),
						percentScrolled = scrollPos / ( $( document ).height() - $window.height() ) * 100;
				
				S.cachedScrollPos = scrollPos;
				F.revealFormSection( percentScrolled, scrollDir );
			},
			
			rgbToHex: function( rgb ) {
				/**
				* takes a css rgb val ex: rgb(255,0,0) and converts it to hex ex: #00FFFF.
				*
				* @called : givePageParagraphs
				* @calls : componentToHex
				* @group : download doc
				*
				* @param {int} rgb
				* @return {string}
				*/
				
				var r,
						g,
						b;
				
				rgb = $.trim( rgb )
				rgb = rgb.slice( 4 );
				rgb = rgb.slice( 0, -1 );
				rgb = rgb.split( ',' );
				
				r = F.componentToHex( parseInt( rgb[ 0 ] ) );
				g = F.componentToHex( parseInt( rgb[ 1 ] ) );
				b = F.componentToHex( parseInt( rgb[ 2 ] ) );
				
				return r + b + g;
			},
			
			rgbToName: function( rgb ) {
				/**
				* php word is used to make the .doc
				* for background (aka highlight) color it only recognizes a limited set of color key words
				* this takes rgb color strings and matches them to similar color key words
				*
				* @group : download doc
				*
				* @param {string} rgb
				* @return {string} color name
				*/
				
				rgb = $.trim( rgb );
				
				if ( rgb === 'rgb(255, 0, 0)' || rgb === 'rgb(255, 51, 51)' ) {
					return 'darkRed';
				} else if ( rgb === 'rgb(255, 102, 102)' || rgb === 'rgb(255, 153, 153)' ) {
					return 'red';
				} else if ( rgb === 'rgb(255, 119, 0)' || rgb === 'rgb(255, 146, 51)' || rgb === 'rgb(255, 173, 102)' ) {
					return 'darkYellow';
				} else if ( rgb === 'rgb(255, 201, 153)' ||
										rgb === 'rgb(255, 255, 0)' ||
										rgb === 'rgb(255, 255, 51)' ||
										rgb === 'rgb(255, 255, 102)' ||
										rgb === 'rgb(255, 255, 153)' )
				{
					return 'yellow';
				} else if ( rgb === 'rgb(0, 255, 0)' ||
										rgb === 'rgb(51, 255, 51)' ||
										rgb === 'rgb(102, 255, 102)' ||
										rgb === 'rgb(153, 255, 153)' )
				{
					return 'green';
				} else if ( rgb === 'rgb(0, 0, 255)' ) {
					return 'darkBlue';
				} else if ( rgb === 'rgb(51, 51, 255)' ) {
					return 'blue';
				} else if ( rgb === 'rgb(102, 102, 255)' ) {
					return 'darkCyan';
				} else if ( rgb === 'rgb(153, 153, 255)' ) {
					return 'cyan';
				} else if ( rgb === 'rgb(255, 0, 255)' || rgb === 'rgb(255, 51, 255)' ) {
					return 'darkMagenta';
				} else if ( rgb === 'rgb(255, 102, 255)' || rgb === 'rgb(255, 153, 255)' ) {
					return 'magenta';
				} else {
					return 'white';
				}
			},
			
			saveDocument: function() {
				/**
				* saves the document.
				* the document is saved on the server.
				* the text files cannot have superflous quill html bc errors will occur if quill is called on quill.
				* bc of this the html string sent to the server needs to be reconstructed
				*
				* @called : click ev on #save, #saveOnExit,
				*						cmd + s
				* @calls : getCurrentSubDir
				* @group : save doc
				*/
				
				var $articleTitle = $( '#articleTitle' ),
						pages = '',
						dir = F.getCurrentSubDir(),
						order = [],
						$article,
						editor,
						sourceCount,
						id,
						$fileMenu = $( '#fileMenu' ),
						isOpen = $fileMenu.hasClass( 'open' ),
						$articles = $( '.article' ),
						$footers = $( '.editorFooter' ),
						i = 0,
						l = $articles.length,
						stringSeperator,
						id;
				
				$fileMenu.addClass( ( isOpen ? 'closed' : 'open' ) )
					.removeClass( ( isOpen ? 'open' : 'closed' ) )
					.removeAttr( 'style' );
				
				// stops function if already saved || the page is locked
				
				if ( S.saved || $( 'body' ).hasClass( 'locked' ) ) {
					return;
				}
				
				S.saved = true;
				
				// get the new title
				
				$( 'title' ).text( $articleTitle.text() );
				
				// reconstruct the html string for the title
				
				title = '<h1 id="articleTitle" tabindex="-1">' +
									$articleTitle.find( '.ql-editor' )[ 0 ].innerHTML +
								'</h1>';
				
				// reconstruct the html strings for each of the pages
				// make the order list
				
				for ( i; i < l; i = i + 1 ) {
					stringSeperator = ( i < l - 1 ? '_  j  gew     jf  n_   fj    hh' : '' );
					$article = $articles.eq( i );
					sourceCount = $article.find( '.articleBody' ).attr( 'data-source_count' );
					id = $article.data( 'date_time' );
					editor = '<article class="article" data-date_time="' + id + '">' +
											'<div id="editor-' + id + '" class="articleBody" tabindex="-1" data-source_count="' + sourceCount + '">' +
												$article.find( '.ql-editor' )[ 0 ].innerHTML +
											'</div>' +
										'</article>';
					pages = pages + editor + $footers.eq( i )[ 0 ].outerHTML + stringSeperator;
				}

				// send the title string, order string, and text (page) object to the server to rewrite the text files 
				
				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'save_doc',
						pages: pages,
						title: title,
						dir: dir
					}
				});
				
			},
			
			setUpQuill: function() {
				/**
				* sets up the full text editing (colors, fonts, size, etc) of each of the pages and title
				* uses the quill plugin
				* adds each object to a global
				* remember that each editor has its own toolbar and each toolbar looks identical and are swapped out
				*
				* @group : editor
				*/
				
				var $articles = $( '.article' ),
						$article,
						$articleBody,
						sourceCount,
						content,
						Q,
						M,
						id,
						i = 0,
						l = $articles.length;
				
				// first set up the header.
				// the snow theme is the only theme. you re-wrote most of css attached to it.
						
				S.Quills.qheader	= new Quill( '#articleTitle',
					{ theme: 'snow' }
				);
				
				// link the head to its toolbar
				
				S.Quills.qheader.addModule( 'toolbar', {
					container: '#toolbar-header'
				});
				
				// add listener on when the header text is updated.
				// when it is, update the <title> and make the page unsaved.
				
				S.Quills.qheader.on( 'text-change', function( delta, source ) {
					var title;
					
					if ( source == 'user' ) {
						title = S.Quills.qheader.getText();
						title = ( $.trim( title ).length === 0 ? 'Untitled' : title );
						
						F.makePageUnsaved( title );
					}
				});
				
				// for all the other pages:
				// get their date_time. this is what links them to their toolbar.
				// get their sourcecount. this tells how many authors are part of it.
				// get the content bc it has to be added seperately to the object.
				// empty the body bc the plugin will repopulate it.
				
				for ( i; i < l; i = i + 1 ) {
					$article = $articles.eq( i );
					$articleBody = $article.find( '.articleBody' );
					sourceCount = parseInt( $articleBody.attr( 'data-source_count' ), 10 );
					id = $article.attr( 'data-date_time' );
					content = $articleBody.html();
					$articleBody.empty();
					
					// make the quill object
					
					S.Quills[ 'q-' + id ]	= new Quill( '#editor-' + id,
						{ theme: 'snow' }
					);
					
					// cache the name for code readabilty
					
					Q = S.Quills[ 'q-' + id ];
					
					// link its toolbar
					
					Q.addModule( 'toolbar', {
					  container: '#toolbar-' + id
					});
					
					// add authorship if applicable

					if ( sourceCount >= 1 ) {
						
						// make the module object
						
						S.Quills[ 'm-' + id ] = Q.addModule( 'authorship', {
							authorId: ( 'user-' + id ),
							color: 'rgba(255,255,255,0)'
						});
						
						// cache the name for code readabilty
						
						M = S.Quills[ 'm-' + id ];
						
						// add the style bc you have to. this is over-written in css.
						
						M.addAuthor( ( 'archiveUser-' + id ), 'rgba(255,255,255,0)' );
						M.addAuthor( ( 'firstSrc-' + id ), 'rgba(255,255,255,0)' );
					}
					
					if ( sourceCount === 2 ) {
						M.addAuthor( ( 'secondSrc-' + id ), 'rgba(255,255,255,0)' );
					}
					
					// enables the authorship module
					
					if ( sourceCount >= 1 ) {
						M.enable();
					}
					
					// add the content back
					
					Q.setHTML( content );
					
					// if the text changes the page is made unsaved
					
					Q.on( 'text-change', function( delta, source ) {
						if (source == 'user') {
							F.makePageUnsaved( S.Quills.qheader.getText() );
						}
					});
				}
			},
			
			setUpRevealFormSection: function() {
				/**
				* sets up global vars with info to be used in the scoll-reveal of doc form sections
				*
				* @group : doc form
				*/
				
				S.bodyH = window.innerHeight;
				S.$body = $( 'body' );
				S.$firstFormSection = $( '#documentForm' ).children().eq( 0 );
				S.$secondFormSection = $( '#documentForm' ).children().eq( 1 );
			},
			
			setUpSplashFeaturesAnimation: function() {
				/**
				* sets up the splash animation.
				* uses svg.js which has a slightly different syntax.
				* triggers the animation.
				*
				* @group : splash animation
				*/
				
				var $initInvisible,
						$leftPage = $( '#leftPageImg' ),
						lSvg = $leftPage.html(),
						$page = $( '#centerPageImg' ),
						svg = $page.html(),
						$rightPage = $( '#rightPageImg' ),
						rSvg = $rightPage.html(),
						L = {},
						C = {},
						R = {};
				
				$leftPage.empty();
				$page.empty();
				$rightPage.empty();
				
				L.draw = SVG( $leftPage[ 0 ] );
				L.draw.svg( lSvg );
				L.$wrap = $leftPage;
				
				C.draw = SVG( $page[ 0 ] ).size( 326, 200 );
				C.draw.svg( svg );
				C.$wrap = $page;
				
				R.draw = SVG( $rightPage[ 0 ] ).size( 90, 120 );
				R.draw.svg( rSvg );
				R.$wrap = $rightPage;
				
				$initInvisible = $( '#cloudGroup, #whiteOutGroup > *' );
				
				$initInvisible.each( function() {
					this.instance.opacity( 0 );
				});

				setTimeout(
					function() {
						L.$wrap.removeClass( 'notVisible' );
						C.$wrap.removeClass( 'notVisible' );
						R.$wrap.removeClass( 'notVisible' );
					},
				500 );
				
				setTimeout(
					function() {
						F.launchSplashTextMergeAnimation();
					},
				1500 );
			},
			
			showCreateDocForm: function() {
				/**
				* animates down the doc form.
				* cache elems
				* enable css animation on $documentFormSections and set their start point
				* add class to form trigger the css animation
				* grow #documentFormExtender to make it scrollable
				* once animation is done make $documentFormSections not animatable again
				* set scroll pos to top
				* set up the scroll-reveal-section ability
				* 
				* @group : doc form
				*/
				
				var $form = $( '#documentForm' ),
						$documentFormSections = $( '.documentFormSection' ),
						addClass = ( S.doesCreateProject ? 'createProject' : 'createDocument' ) + ' visible reveal',
						removeClass = ( S.doesCreateProject ? 'createDocument' : 'createProject' ) + ' notVisible',
						height = ( S.doesCreateProject ? '300%' : '200%' );
				
				$documentFormSections
					.attr( 'data-animatable', 'true' )
					.css( 'transform', 'translateY(0)' );
				
				$form.addClass( addClass )
					.removeClass( removeClass );
					
				$( '#documentFormExtender' ).css( 'height', height );
					
				setTimeout(
					function() {
						var $window = $( window );
						
						window.scrollTo( 0, 0 );
						
						F.setUpRevealFormSection();
						
						$( window ).on( S.resize, function() {
							F.setUpRevealFormSection();
						}).on( S.scroll, F.revealFormSectionEvent );
						
						$form.removeClass( 'reveal' );
						
						$documentFormSections.attr( 'data-animatable', 'false' );
					},
				// 820 is the animation-duration for the drop down of the form
				820 );
			},
			
			showPopUp: function( action ) {
				/**
				* take the param and check which on it is to get the pop up to show then show it by toggleing classes.
				*
				* @group : pop ups
				*
				* @param {string} action
				*/
				
				var $popUp;
				
				$( '#popUps' ).addClass( 'visible' )
					.removeClass( 'notVisible' );
					
				if ( action === 'delete project' ) {
					$popUp = $( '#trashWholeDocWrap' );
				} else if ( action === 'delete section' ) {
					$popUp = $( '#trashDocumentPieceWrap' );
				} else if ( action === 'loading' ) {
					$popUp = $( '#loadWrap' );
				} else if ( action === 'new doc' ) {
					$popUp = $( '#toNewDocWrap' );
					
					$( '#loadWrap' ).addClass( 'notVisible' )
						.removeClass( 'visible' );
				}
				
				$popUp.addClass( 'visible' )
					.removeClass( 'notVisible' );
			},
			
			togglePasswordVisiblity: function() {
				/**
				* will either close || open password input menu or send try to unlock the page depending
				*
				* @group : un / lock page
				*/
				
				var $lockMenu = $( '#toggleLockMenu' ),
						val,
						$password = $( '#unlockPasswordInput' ),
						closeOrOpen;
				
				// get the open or closes action of the menu and store it in closeOrOpen
						
				if ( $lockMenu.hasClass( 'closed' ) === false ) {
					if ( $lockMenu.hasClass( 'open' ) === false ) {
						closeOrOpen = 'open';
					} else {
						closeOrOpen = 'close';
					}
				} else {
					closeOrOpen = 'open';
				}
				
				// if you open the menu toggle the open close classes
				// this triggers a css animation
				// focus on the pasword input once the animation finishes
				
				if ( closeOrOpen === 'open' ) {
					$lockMenu.removeClass( 'closed' )
						.addClass( 'open' );
						
					setTimeout(
						function() {
							$password.focus();
						},
						// animation dur
					300 );
				}
				
				// if you close the menu first check that the password input is empty, if so close it by toggling classes
				// and removing focus
				// else do not toggle classes and try to unlock the page
				
				if ( closeOrOpen === 'close' ) {
					$password = $( '#unlockPasswordInput' );
					val = $password.val();
					
					if ( val.length === 0 ) {
						$lockMenu.removeClass( 'open' )
							.addClass( 'closed' );
							
						$password.blur();
					} else {
						F.tryToUnlock( val );
					}
				}
			},
			
			tryToUnlock: function( passwordAttempt ) {
				/**
				* if the password is empty || they put in a bad password gor an error and tried again right away: cancel function.
				* get the subdirectory to check against
				* send passwordAttempt attempt to server to try against
				* 'nope' || 'yup' is sent back.
				* if 'nope' show error else call unlockPage
				*
				* @group : unlock page
				*
				* @param {string} passwordAttempt
				*/
				
				var dir,
						$wrap = $( '#unlockPasswordInputWrap' );
				
				if ( passwordAttempt.length === 0 || $wrap.hasClass( 'inputError' ) ) {
					return;
				}
				
				dir = F.getCurrentSubDir();
				
				$.ajax({
					type: 'POST',
					url: S.pathToRoot + 'functions.php',
					data: {
						action: 'try_to_unlock',
						passwordAttempt: passwordAttempt,
						dir: dir
					},
					success: function( data ) {
						console.log( data );
						if ( data === 'yup' ) {
							F.unlockPage();
						} else if ( data === 'nope' ) {
							$( '#unlockPasswordInputWrap' ).addClass( 'inputError' );
						}
					}
				});
			},
			
			unlockPage: function() {
				/**
				* make text editors editable again.
				* clear the password input.
				* toggle the locked class on body.
				* close the toggleLockMenu by triggering a css animation
				*
				* @group : unlock page
				*/
				
				$( '.ql-editor, .ql-paste-manager' ).attr( 'contenteditable', 'true' );
				
				$( '#unlockPasswordInput' ).val( '' );
				
				$( 'body' ).removeClass( 'locked' )
					.addClass( 'unlocked' );
					
				$( '#toggleLockMenu' ).removeClass( 'open' )
					.addClass( 'closed' );
			}
		},
		
		init: function() {
			/**
			* this kicks off everything.
			*
			* @group : init
			*/
			
			F = this.funcs;
			S = this.settings;
			
			F.bindUiActions();
			F.addCustomScroll();
			
			if ( S.isSplash ) {
				F.setUpSplashFeaturesAnimation();
			} else {
				$( 'body' ).removeClass( 'transitionToNew' );
				F.setUpQuill();
				if ( $( 'body' ).hasClass( 'locked' ) ) {
					F.lockPage();
				}
			}
			
			setTimeout(
				function() {
					$( window ).off( 'load' );
					$( 'body' ).removeClass( 'loading' );
				},
			300 );
		}
	}
	CUT_UPS.init(); // initiates the site
});