<?php
require_once 'PhpWord-Master/src/PhpWord/Autoloader.php';
\PhpOffice\PhpWord\Autoloader::register();

if ( is_ajax() ) {
/**
* Calls php functions from ajax
*
* @since 1.0
*
* @caller ajax user action
* @calls is_ajax
* @ingorup user actions
*
* @param bool is_ajax() checks if it's an ajax call
*
* @var string $action is the function name called from ajax
*/
  if ( isset( $_POST[ 'action' ] ) && !empty( $_POST[ 'action' ] ) ) {
		$action = $_POST[ 'action' ];
		
    if ( $action === 'make_doc' ) {
    	make_doc( $_POST[ 'docParams' ], $_POST[ 'projectParams' ] );
    } elseif ( $action === 'save_doc' ) {
    	save_doc( $_POST[ 'dir' ], $_POST[ 'title' ], $_POST[ 'pages' ] );
    } elseif ( $action === 'delete_doc' ) {
    	delete_doc( $_POST[ 'dir' ] );
    } elseif ( $action === 'update_editor_instructions' ) {
    	update_editor_instructions( $_POST[ 'dir' ] );
    } elseif ( $action === 'try_to_unlock' ) {
    	try_to_unlock( $_POST[ 'passwordAttempt' ], $_POST[ 'dir' ] );
    } elseif ( $action === 'lock_page' ) {
    	lock_page( $_POST[ 'dir' ] );
    } elseif ( $action === 'download_doc' ) {
    	make_word_doc( $_POST[ 'Doc' ], $_POST[ 'dir' ] );
    }
  }
}

function add_index_file( $dir ) {
/**
* description make the index file
* add php functions to make the page when called
*
* @since 1.0
*
* @caller make_doc
* @ingroup make doc
*
* @var object $file : the index file
* @var string $content
*
* @param string $dir - the directory to add it to
*/

	$file = fopen( $dir . '/index.php', 'w' );
	
	$content = '<?php include "../functions.php"; ?>';
	
	$content = $content . '<?php echo make_index_doc_header( "' . $dir . '" ); ?>';
	
	$content = $content . '<?php echo make_pop_ups(); ?>';
	
	$content = $content . '<?php echo make_the_about(); ?>';
	
	$content = $content . '<?php echo make_init_editor_instructions( "' . $dir . '" ); ?>';
	
	$content = $content . '<?php echo make_the_editor( "' . $dir . '" ); ?>';
	
	$content = $content . '<?php echo make_doc_form(); ?>';
	
	$content = $content . '<?php echo make_index_doc_footer(); ?>';

	fwrite( $file, $content );
	
	fclose( $file );
}

function add_piece( $title, $content ) {
/**
* makes a new piece (a page in the project) or updates one on save
*
* @since 1.0
*	@caller make_doc,
*					save_doc
* @ingroup make doc / save doc
*
* @param string $title 
* @param string $content
*
* @var object $pieceFile the new / updated file
*/
	
	$pieceFile = fopen( $title, 'w' );
	
	fwrite( $pieceFile, $content );
	
	fclose( $pieceFile );
}

function combine_sources( $firstSrc, $secondSrc, $id ) {
/**
* Combines two text sources, line after line like a deck of cards
* surrounds each line in 2 spans that are used by quill.js
* the outer sets the authorship, the inner sets the font-family
*
* @since 1.0
*
* @caller make_doc
* @calls split_source_into_chunks
* @ingroup make doc
*
* @param string $firstSrc is the first text source. it is made into an array by split_source_into_chunks.
* @param string $seconsSrc. see $firstSrc.
*
* @return html string $content, the file's editable, main text
*
* @var string $content is the file's editable, main text
* @var string $space a piece of white space used to fix a glitch wherein the last two text strings can merge together
* @var array $firstSrcs an array of the $firstSrc string broken up into full word strings ~ 85 chars long
* @var int $firstL # of members in $firstSrcs
* @var array $secondSrcs. see $firstSrcs.
* @var int $secondL. see $firstL.
* @var $l greater of $firstL and $secondL used in the combining loop.
*/
	
	$content = '';
	$space = '';
	
	$firstSrcs = split_source_into_chunks( $firstSrc );
	$firstL = count( $firstSrcs );
	
	$secondSrcs = split_source_into_chunks( $secondSrc );
	$secondL = count( $secondSrcs );
	
	$l = ( $firstL >= $secondL ? $firstL : $secondL );
	
	for ( $i = 0; $i < $l; $i = $i + 1 ) {
		if ( $i === $l - 1 ) {
			$space = ' ';
		}
		
		$content = $content . '<span class="author-firstSrc-' . $id . '" style="font-size: 18px;"><span style="font-family: serif;">' . $firstSrcs[ $i ] . $space . '</span></span>';
		
		$content = $content . '<span class="author-secondSrc-' . $id . '" style="font-size: 18px;"><span style="font-family: serif;">' . $secondSrcs[ $i ] . $space . '</span></span>';
	}
	
	return $content;
}

function delete_doc( $dir ) {
/**
* set ups the directory deletion process and calls delete_tree to actually delete it.
* it checks the last file in the directory as a fail safe to prevent the deleteion of the whole site
* if the home directory is somehow targeted.
*
* @since 1.0
*
* @caller ajax user action
* @calls delete_tree
* @ingroup delete doc
*
* @param string $dir is the directory to be trashed.
*
* @return null
*
* @var array $files is all the directory's files' and directories
* @var string $lastFile is the last file in the directory
*/
	
	$files = scandir( $dir );
	$lastFile = $files[ count( $files ) - 1 ];
	
	if ( $lastFile === 'zzz.txt' ) {
		return;
	}
	
	if ( $lastFile === 'subfile.txt' ) {
		delete_tree( $dir );
		
		try {
			$dbLogin = db_login();
	    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
			$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
			$sql = "DELETE FROM projects WHERE directory = :directory_to_delete";
			$query = $db->prepare( $sql );
			$query->execute( array( ':directory_to_delete'=>$dir ) );
		} catch ( PDOException $e ) {
			die( 'Could not connect to the database:<br/>' . $e );
		}
	}
	
	die();
}

function delete_tree( $dir ) {
/**
* gets all the files and directories from the given directory (excluding hidden files) and loops over them deleting them.
* checks if the file '000.txt' file is present which is the first file in the main directory.
* prevents the action as a fail safe if it finds it.
* deletes the directory itself after deleting the contents.
*
* @since 1.0
*
* @caller delete_doc
* @ingroup delete doc
*
* @param string $dir is the directory to be trashed.
*
* @return null
*
* @var array $files is all the directory's files' and directories
*/
	
	$files = array_diff( scandir( $dir ), array( '.', '..' ) );
	
	foreach ( $files as $file ) {
		if ( $file === '000.txt' ) {
			break;
			return;
		}
		
		( is_dir( "$dir/$file" ) ) ? delete_tree( "$dir/$file" ) : unlink( "$dir/$file" );
	}
	
	rmdir( $dir );
}

function get_published_content( $file, $maxCharCnt ){
/**
* gets a block of the text of a published source.
* has a set amount of chars but a random starting point.
* the text is copied to allow for the set aount of chars to be long than the doc itself (the doc just repeats from it's start)
* trims the string to the last full word a returns it.
*
* @since 1.0
*
* @caller make_content
* @ingroup make doc
*
* @param string $file file path to given source, then full text string of source
* @param int $maxCharCnt max # of characters $file is to be trimmed to
*
* @return string $content, the returned block of text
*
* @var string $file full text string of source
* @var string $fileCopy copy of the $file's text used to elongagte it
* @var int $l, # of times the text to be copied
* @var string $content, the returned block of text
*/
	
	$file = file_get_contents( $file );
	$fileCopy = $file;
	$fileCharCnt = strlen( $file );
	
	$i = 0;
	$l = ceil( $maxCharCnt / $fileCharCnt ) + 1;
	
	for ( $i; $i < $l; $i = $i + 1 ) {
		$file = $file . $fileCopy;
	}
	
	$content = substr( $file, rand( 0, $fileCharCnt ), $maxCharCnt );
	$content = substr( $content, strpos( $content, ' ' ) );
	$content = substr( $content, 0, strrpos( $content, ' ' ) );
	
	return $content;
}

function get_source_list( $sourceNum, $path ) {
/**
* creates an html form string listing the selections of published sources
*
* @since 1.0
*
* @caller make_doc_form
* @ingroup load index file
*
* @param int $sourceNum
* @param string $path, path to the sources directory which is different if loading from main index or user's directory
*
* @return html string $sourceList, the selection choices of the published content
*
* @var array $sourceNames, all names of the sources
* @var string $sourceOrder, string used in the input elements to differenciate the two groups
* @var string $sourceList, the selection choices of the published content
* @var int $pos, position of '.' in source name, used to remove file type
* @var string $sourceName, the name of a given source w/out the file type
*/
	
	$sourceNames = scandir( $path . 'sources' );
	$sourceOrder = ( $sourceNum === 1 ? 'first' : 'second' );
	
	$sourceList = '<label>' .
									'<input autocomplete="off" type="radio" name="' . $sourceOrder . 'PublishedSource"' .
										 'checked="checked" class="checked" />' .
									'<cite data-filename="nope">none</cite>' .
								'</label>';
	
	$i = 0;
	$l = count( $sourceNames );
	
	for ( $i = 0; $i < $l; $i = $i + 1 ) {
		$sourceName = $sourceNames[ $i ];
		
		if( $sourceName[ 0 ] !== '.' ) {
			$pos = strrpos( $sourceName, '.' );
			
			if ( $pos !== -1 ) {
				$sourceName = substr( $sourceName, 0, $pos );
			}
			
			$sourceList = $sourceList . '<label>' .
																		'<input autocomplete="off" type="radio" name="' . $sourceOrder . 'PublishedSource" />' .
																		'<cite data-filename="' . $sourceNames[ $i ] . '">' . $sourceName . '</cite>' .
																	'</label>';
		}
	}
	
	return $sourceList;
}

function db_login() {
/**
* returns a standard object used in mysql databae login
*
* @since 1.0
*
* @caller
* @ingroup
*
* @return 
*/
	
	return array( 
		'dsn'	 => 'mysql:dbname=cutups;host=localhost;port=8888',
		'user' => 'editor',
		'pass' => 'TvXhRzNztLhmbhqF'
	);
}

function is_ajax() {
/**
* determines if php call came from ajax
*
* @since 1.0
*
* @ingorup user actions
*
* @return bool is_ajax() checks if it's an ajax call
*/
	
	return isset( $_SERVER[ 'HTTP_X_REQUESTED_WITH' ] ) && strtolower( $_SERVER[ 'HTTP_X_REQUESTED_WITH' ] ) == 'xmlhttprequest';
}

function lock_page( $dir ) {
/**
* changes the file holding the locked state to locked
*
* @since 1.0
*
* @caller ajax user action
* @ingroup lock page
*
* @param string $dir, the user's directory
*/
	
	$dbLogin = db_login();
	
	try {
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$sql = "UPDATE projects SET islocked=? WHERE directory=?";
		$query = $db->prepare( $sql );
		$query->execute( array( 1, $dir ) );
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
}

function make_content( $docParams ) {
/**
* creates the editable content and returns it as a html string
*
* @since 1.0
*
* @caller make_doc
* @calls get_published_content,
*				 combine_sources
*
* @ingroup make doc
*
* @param object $docParams
* @return object $result w. info on the new content 
*/
	
	$firstSrc = $docParams[ 'firstSource' ];
	$firstType = $docParams[ 'firstSourceType' ];
	$secondSrc = $docParams[ 'secondSource' ];
	$secondType = $docParams[ 'secondSourceType' ];
	
	$content;
	$path = 'sources/';
	$maxCharCnt = 2200;
	$id = time();
	
	$result = array(
		'content' => '',
		'numOfSrcs' => '0',
		'date_time' => $id
	);
	
	if ( $firstSrc === '' && $secondSrc === '' ) {
		$result[ 'content' ] = '<span class="author-user-' . $id . '" style="font-size: 18px;"><span style="font-family: serif;">type here...</span></span>';
		
		return $result;
	}
	
	$do_mix = true;
	
	if ( ( $firstSrc === '' || $secondSrc === '' ) ||
			 ( $firstSrc === $secondSrc )
	) {
		$do_mix = false;
	}
	
	if ( !$do_mix ) {
		$source = ( $firstSrc !== '' ? $firstSrc : $secondSrc );
		$type = ( $firstSrc !== '' ? $firstType : $secondType );
		
		$result[ 'numOfSrcs' ] = '1';
		
		if ( $type === 'published' ) {
			$content = get_published_content( $path . $source, $maxCharCnt );
			
			$result[ 'content' ] =
				'<span class="author-firstSrc-' . $id . '" style="font-size: 18px;">' .
					'<span style="font-family: serif;">' .
						$content .
					'</span>' .
				'</span>';
		} else {
			$result[ 'content' ] =
				'<span class="author-user-' . $id . '" style="font-size: 18px;">' .
					'<span style="font-family: serif;">' .
						$source .
					'</span>' .
				'</span>';
		}
		
		return $result;
	}
	
	if ( $firstType === 'published' && $secondType === 'published' ) {
		$firstSrc = get_published_content( $path . $firstSrc, $maxCharCnt / 2 );
		$secondSrc = get_published_content( $path . $secondSrc, $maxCharCnt / 2 );
	} else if ( $firstType === 'input' && $secondType === 'input' ) {
		$firstSrc = $firstSrc . ' ';
		$secondSrc = $secondSrc . ' ';
	} else {
		$inputSrc = ( $firstType === 'input' ? $firstSrc : $secondSrc ) . ' ';
		
		$publishedSrc = ( $firstType === 'published' ? $firstSrc : $secondSrc );
		$publishedSrc = get_published_content( $path . $publishedSrc, strlen($inputSrc) ) . ' ';
		
		$firstSrc = ( $firstType === 'published' ? $publishedSrc : $inputSrc );
		$secondSrc = ( $secondType === 'published' ? $publishedSrc : $inputSrc );
	}
	
	$result[ 'numOfSrcs' ] = '2';
	$result[ 'content' ] = combine_sources( $firstSrc , $secondSrc, $id );
	
	return $result;
}

function make_directory_name( $min, $max ) {
/**
* creates a random alpha numeric string to used to create user's directory name.
* code is lifted from stack over flow, see below.
*
* @since 1.0
*
* @caller make_new_dir
* @ingroup make doc
*
* @param ?
*
* @return ?
*
* @see http://stackoverflow.com/questions/1846202/php-how-to-generate-a-random-unique-alphanumeric-string/13733588#13733588
*/
	
	$range = $max - $min;
	
	if ( $range < 0 ) {
		return $min;
	}
	
	$log = log( $range, 2 );
	$bytes = (int) ($log / 8) + 1;
	$bits = (int) $log + 1;
	$filter = (int) (1 << $bits) - 1;
	
	do {
		$rnd = hexdec( bin2hex( openssl_random_pseudo_bytes( $bytes ) ) );
		$rnd = $rnd & $filter;
	} while ( $rnd >= $range );
	
	return $min + $rnd;
}

function make_doc( $docParams, $projectParams ) {
/**
* comnines all the html strings into an index.php file
* creates a sub directory
* returns the path
*
* @since 1.0
*
* @caller user action
* @calls make_content,
*				 make_editor_article,
*				 make_new_dir,
*				 add_piece,
*				 add_index_file
*				 make_the_toolbar
* @ingroup make doc
*
* @param object $docParams all the params to make a doc
* @param object $projectParams extra params to make a new project
* @return object $return the new content with meta data sent back to the client
*/
	
	$newDocLocation = $docParams[ 'newDocLocation' ];
	
	$amInASubDir = filter_var( $projectParams[ 'amInSubDir' ], FILTER_VALIDATE_BOOLEAN );
	
	$makeProject = filter_var( $projectParams[ 'makeProject' ], FILTER_VALIDATE_BOOLEAN );
	
	$contentObj = make_content( $docParams );
	
	$editor_article = make_editor_article( $contentObj );
	
	$dbLogin = db_login();
	
	if ( $makeProject ) {
		$password = $projectParams[ 'password' ];
		$password = ( strlen( trim($password) ) > 0 ? $password : null );
		
		$dir = make_new_dir();
		
		$title =
			'<h1 id="articleTitle" tabindex="-1">' .
				'<i><span style="font-size: 32px;">' . $projectParams[ 'title' ] . '</span></i>' .
			'</h1>';
		
		$islocked = 0;
		
		$showinstructions = 1;
		
		add_piece( $dir . '/subfile' . '.txt', 'user file' );
		
		add_index_file( $dir );
		
		$return = array(
			'makeProject' => true,
			'href' => $dir,
			'isInNewTab' => ( $newDocLocation === 'new tab' ? true : false )
		);
		
		try {
	    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
			$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
			
$sql = <<<SQL
	INSERT INTO projects( directory, title, password, islocked, pages, showinstructions )
	VALUES( :directory, :title, :password, :islocked, :pages, :showinstructions )
SQL;

			$query = $db->prepare( $sql );
			
			$query->execute(
				array(
					':directory' => $dir,
					':title' => $title,
					':password' => $password,
					':islocked' => $islocked,
					':pages' => $editor_article,
					':showinstructions' => $showinstructions
				)
			);
		} catch ( PDOException $e ) {
			die( 'Could not connect to the database:<br/>' . $e );
		}
	} else {
		$toolbar = make_the_toolbar( $contentObj[ 'date_time' ], 'notSelected' );
		$editor_article =  $toolbar . $editor_article;
		
		$return = array(
			'makeProject' => false,
			'editor' =>  $editor_article,
			'$Ob' => $newDocLocation
		);
	}
	
	echo( json_encode( $return ) );
	
	die();
}

function make_doc_footer( $path_to_root = '' ) {
/**
* constructs the footer of the splash and returns it
*
* @since 1.0
*
* @caller user loads splash
* @ingroup make splash index
*
* @param optional string url path
* @return html string
*/
	
$doc_footer = <<<EOD
	<script src="{$path_to_root}scripts/jquery.js"></script>
	<!-- <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script> -->
	<script src="{$path_to_root}scripts/plugins.js"></script>
	<script src="{$path_to_root}scripts/script.js"></script>
	</body>
</html>
EOD;

	return $doc_footer;
}

function make_doc_form( $path = '../' ) {
/**
* constructs the doc form and returns it 
*
* @since 1.0
*
* @caller user loads index page
* @calls get_source_list
* @ingroup make index
*
* @param optional string url path
* @return html string with the forms
*/
	
	$firstSources = get_source_list( 1, $path );
	$secondSources = get_source_list( 2, $path );
	
$pop_up_slides = <<<EOD
<form id="documentForm" class="notVisible">

	<article class="documentFormSection default" data-animatable="false">
		<span tabindex="-1" class="ir btn logo">cut ups</span>
		<fieldset id="src1">
			<div class="twoSrcs">
			
				<button type="button" tabindex="-1" class="btn ir textInputBtn">text input</button>
				<button type="button" tabindex="-1" class="btn ir publishedTextBtn">published input</button>
			
				<header class="documentFormHeader">
					<span>select first</span><br/>
					<span>source</span>
				</header>
			
				<div class="inputTextSrc">
					<p class="editable" tabindex="-1" contenteditable="true" data-original_value="input / paste text">input / paste text</p>
				</div>
				<div class="publishedTextSrc">
					$firstSources
				</div>
			</div>
			
		</fieldset>
		<footer id="src1Footer"><span class="makeProjectText">1 of 3</span><span class="makeDocumentText">1 of 2</span></footer>
		<span class="scrollArrow">scroll to reveal</span>
	</article>

	<article class="documentFormSection default" data-animatable="false">
		<span tabindex="-1" class="ir btn logo">cut ups</span>
		<fieldset id="src2">
			<div class="twoSrcs">
			
				<button type="button" tabindex="-1" class="btn ir textInputBtn">text input</button>
				<button type="button" tabindex="-1" class="btn ir publishedTextBtn">published input</button>
			
				<header class="documentFormHeader">
					<span>select second</span><br/>
					<span>source</span>
				</header>
			
				<div class="inputTextSrc">
					<p class="editable"tabindex="-1" contenteditable="true" data-original_value="input / paste text">input / paste text</p>
				</div>
				<div class="publishedTextSrc">
					$secondSources
				</div>
			</div>
			<label id="finalDocFormStep">
				Click to add page
				<button type="button" tabindex="-1" class="ir btn makeProject visible makeDoc"></button>
			</label>
			
		</fieldset>
		<footer id="src2Footer"><span class="makeProjectText">2 of 3</span><span class="makeDocumentText">2 of 2</span></footer>
		<span class="scrollArrow">scroll to reveal</span>
	</article>

	<article id="titleAndPasswordInputOuterWrap" class="documentFormSection" data-animatable="false">
		<span tabindex="-1" class="ir btn logo">cut ups</span>
		<fieldset id="titleAndPasswordInputInnerWrap">
			<div id="titleInputWrap">
				<input autocomplete="off" tabindex="-1" class="textInput" type="text" id="titleInput" data-original_value="Title" value="Title" />
				<span class="style notVisible copiedText">Title</span>
			</div>
			<div id="passwordInputWrap">
				<input autocomplete="off" tabindex="-1" class="textInput passwordInput" type="text" id="passwordInput" data-original_value="Password (optional)" value="Password (optional)" maxlength="15" />
				<span class="style notVisible copiedText"></span>
			</div>
		
			<label id="finalProjectFormStep">
				Click to make doc
				<button type="button" tabindex="-1" class="ir btn makeProject visible makeDoc"></button>
			</label>
		</fieldset>
		<footer id="titleAndPasswordFooter">3 of 3</footer>
	</article>

</form>
<div id="documentFormExtender" class="style extender"></div>
<button type="button" tabindex="-1" class="ir btn hideCreate x"></button>
EOD;

	return $pop_up_slides;
}

function make_doc_head() {
/**
* makes the splash header and returns it
*
* @since 1.0
*
* @caller load splash
* @ingroup splash
*
* @return html string - the splash header
*/
	
$doc_head = <<<EOD
<html lang="en-us" class="splashPage">
	<head>
		<meta charset="utf-8">
		<title>c u t u p</title>
		<meta name="description" content="Cutups is used to write and save original compositions and make cut-ups in the style of William Burroughs.">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="stylesheet" href="styles/stylesheets/main.css">
	</head>
	<body class="loading unlocked">
EOD;

	return $doc_head;
}

function make_editor_article( $contentObj ) {
/**
* makes the content in the new document
*
* @since 1.0
*
* @param object $contentObj
* @caller make_doc
* @ingroup editor
*
* @return html string - the page in the new document
*/
	
	$numOfSrcs = $contentObj[ 'numOfSrcs' ];
	$content = $contentObj[ 'content' ];
	$date_time = $contentObj[ 'date_time' ];
	
$editor_article = <<<EOD
<article class="article" data-date_time="$date_time">
	<div id="editor-$date_time" class="articleBody" data-source_count="{$numOfSrcs}" tabindex="-1">$content</div>
</article>
<footer class="editorFooter">
	<button type="button" tabindex="-1" class="addNextDoc ir menuBtn launchCreate" data-create_project="nope">add a new doc</button>
	<button type="button" tabindex="-1" class="deletePrevDoc ir menuBtn">delete the previous doc</button>
</footer>
EOD;

	return $editor_article;
}

function make_index_doc_footer() {
/**
* returns a simple html string with the script elems and closing tags of the body and html
* adds to the string in the order each elem will appear.
*
* @since 1.0
*
* @caller load user index file
* @ingroup load index file
*
* @return / @var html string $index_doc_footer, the script elems and closing tags of the body and html
*/
	
$index_doc_footer = <<<EOD
			<script src="../scripts/jquery.js"></script>
			<script src="../scripts/plugins.js"></script>
			<script src="../scripts/script.js"></script>
		</body>
	</html>
EOD;

	return $index_doc_footer;
}

function make_index_doc_header( $dir ) {
	/**
	* returns an html string for head and body openeing for the user created index files
	* 
	* @since 1.0
	*
	* @caller load user index file
	* @ingroup load index file
	*
	* @return / @var html string $index_doc_header, the <head> elem,
	* <body> open tag, logo btn, and <iframe> downloader elem for getting .doc files
	*
	* @var string $title, page title stored in title.txt
	* @var string $islocked, body class determined by islocked db value,
	* @var string $lock_scrolling, body class determined by showinstructions db value, 
	* will only have this class until the user views the instructions and closes the pop up.
	*/

	try {
		$dbLogin = db_login();
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$stmt = $db->prepare( "SELECT * FROM projects WHERE directory='" . $dir . "' LIMIT 1" );
		$stmt->execute(); 
		$row = $stmt->fetch();
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}

	$title = strip_tags( $row[ 'title' ] );
	$showinstructions = $row[ 'showinstructions' ];
	$islocked = $row[ 'islocked' ];
	
	$locked_status = ( $islocked ? 'locked' : 'unlocked' );
	$lock_scrolling = ( $showinstructions ? 'noScroll' : '' );
	
$index_doc_header = <<<EOD
	<html lang="en-us" class="editorPage">
		<head>
			<meta charset="utf-8">
			<title>$title</title>
			<meta name="description" content="Cutups is used to write and save original compositions and make cut-ups in the style of William Burroughs.">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<link rel="stylesheet" href="../styles/stylesheets/main.css">
		</head>
		
		<body class="$locked_status transitionToNew $lock_scrolling loading">
			<iframe id="fileDownloader" style="display:none" src=""></iframe>
			<span class="ir btn logo" id="mainLogo">cut ups</span>
EOD;

	return $index_doc_header;
}

function make_init_editor_instructions( $dir ) {
/**
* this makes the pop up explain the icons
* appears whenever the opens a new page
* stops appearing once the user closes the pop up
*
* @since 1.0
*
* @caller user loads a new index page
* @ingroup editor
*
* returns an html string with the about pop up
*/
	
	$dbLogin = db_login();
	
	try {
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$stmt = $db->prepare( "SELECT * FROM projects WHERE directory='" . $dir . "' LIMIT 1" );
		$stmt->execute(); 
		$row = $stmt->fetch();
		$password = $row[ 'password' ];
		$showinstructions = $row[ 'showinstructions' ];
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
	
	if ( $showinstructions ) {
		if( isset( $password ) ) {
$locked_instructions = <<<EOD
	<li id="def-lock">
		<figure></figure>
		Makes doc uneditable.
	</li>
	<li id="def-unlock">
		<figure></figure>
		Unlocks doc with password.
	</li>
EOD;
		} else {
			$locked_instructions = '';
		}
$editor_instructions = <<<EOD
<aside id="instructionsPage">
	<header>
		<h1>Instructions</h1>
		<button type="button" tabindex="-1" class="menuBtn ir closeInstructions" id="instructionsX">close</button>
	</header>
	<p>Remember to save the url in the address bar to access your doc later.</p>
	<p>The top-most text box changes the doc's name.</p>
	<p>Type in the text boxes as you would in any text editor.</p>
	<ol>
		<li id="def-folder">
			<figure></figure>
			File menu.
		</li>
		<li>
			<ol>
				<li id="def-save">
					<figure></figure>
					Save doc to cloud.
				</li>
				<li id="def-download">
					<figure></figure>
					Downloads .doc file.
				</li>
				<li id="def-newDoc">
					<figure></figure>
					Makes a new doc in a new tab.
				</li>
				<li id="def-trash">
					<figure></figure>
					Deletes current doc.
				</li>
			</ol>
		</li>
		<li id="def-showStyles">
			<figure></figure>
			Text style menu.
		</li>
		<li>
			<ol>
				<li id="def-font">
					<figure></figure>
					Changes font.
				</li>
				<li id="def-size">
					<figure></figure>
					Changes size.
				</li>
				<li id="def-bold">
					<figure></figure>
					Makes text bold.
				</li>
				<li id="def-italic">
					<figure></figure>
					Makes text italic.
				</li>
				<li id="def-alignment">
					<figure></figure>
					Changes paragraph alignment.
				</li>
				<li id="def-textColor">
					<figure></figure>
					Changes text's color.
				</li>
				<li id="def-bgColor">
					<figure></figure>
					Changes text's background color.
				</li>
			</ol>
		</li>
		<li id="def-newPage">
			<figure></figure>
			Adds a new page to your doc.
		</li>
		<li id="def-trashPage">
			<div>
				<figure></figure>
			</div>
			Deletes the page of your doc it is attached to.
		</li>
		$locked_instructions
		<li id="def-showAuthorship">
			<figure></figure>
			Highlights the different authors of the text [if applicable].
		</li>
		<li id="def-hideAuthorship">
			<figure></figure>
			De-highlights the different authors of the text [if applicable].
		</li>
	</ol>
	<footer>
		<button type="button" tabindex="-1" class="textBtn closeInstructions">okay</button>
	</footer>
</aside>
EOD;
	} else {
		$editor_instructions = '';
	}

	return $editor_instructions;
}

function make_new_dir() {
/**
* creates a new directory named after a randomly created alpha-numeric string.
*
* @since 1.0
*
* @caller make_doc
* @calls return_directory_name
* @calls self if the new directory's name is in use.
* @ingroup make doc
*
* @return / @var string $dir, the new direcory's name
*/
	$dir = return_directory_name( 7 );
	
	if ( !is_dir( $dir ) ) {
		mkdir( $dir, 0777, true );
		return $dir;
	} else {
		make_new_dir();
	}
}

function make_pop_ups( $type = 'editor' ) {
/**
* returns an html string of the pop ups
*
* @since 1.0
*
* @caller splash and user's index
* @ingroup both
*
* @param optional string $type sets if it's splash or editor
* @return an html string of the pop ups used 
*/
	
	if ( $type === 'editor' ) {
$popUpWarningsOnTrash = <<< EOD
	<article id="trashWholeDocWrap" class="notVisible popUp textPopUp">
		<form>
			<legand>Delete document?</legand>
			<p class="details">This trashes the whole document. It's permanent.</p>
			<button type="button" tabindex="-1" class="textBtn" id="confirmTrashWholeDoc">trash</button>
			<span class="slash style"></span>
			<button type="button" tabindex="-1" class="textBtn" id="denyTrashWholeDoc">cancel</button>
		</form>
	</article>
	
	<article id="trashDocumentPieceWrap" class="notVisible popUp textPopUp">
		<form>
			<legand>Delete section?</legand>
			<p class="details">This deletes this piece of the document, not the whole thing. It's permanent.</p>
			<button type="button" tabindex="-1" class="textBtn" id="confirmTrashDocPiece">trash</button>
			<span class="slash style"></span>
			<button type="button" tabindex="-1" class="textBtn" id="denyTrashDocPiece">cancel</button>
		</form>
	</article>
	
	<article id="toNewDocWrap" class="notVisible popUp textPopUp">
		<div>
			<h1>Doc link:</h1>
			<p class="details">Click <a href="#" target="_blank" tabindex="-1" id="newDocLink">here</a> to open your new doc in another tab.</p>
		</div>
	</article>
EOD;
	} else {
		$popUpWarningsOnTrash = '';
	}
	
$popUps = <<< EOD
	<section id="popUps" class="notVisible">
		<figure id="loadWrap" class="notVisible popUp">
			<div id="loadInnerWrap">
			  <div id="loadCube">
			    <div id="side1" class="sides"></div>
			    <div id="side2" class="sides"></div>
			    <div id="side3" class="sides"></div>
			    <div id="side4" class="sides"></div>
			    <div id="side5" class="sides"></div>
			    <div id="side6" class="sides"></div>
			  </div>
			</div>
			<figcaption>loading</figcaption>
		</figure>
		
		<article id="oldBrowserWrap" class="notVisible popUp textPopUp">
			<div>
				<h1>Old browser.</h1>
				<p class="details">Your browser is too old for this site.	Update it <a href="http://browsehappy.com/" tabindex="-1" target="_blank">here.</a></p>
			</div>
		</article>
		
		<article id="noJsWrap" class="notVisible popUp textPopUp">
			<div>
				<h1>Javascript disabled.</h1>
				<p class="details">Javascript is required for this site. Instructions on enabling it <a href="http://enable-javascript.com" tabindex="-1" target="_blank">here.</a></p>
			</div>
		</article>
		$popUpWarningsOnTrash
	</section>
EOD;

	return $popUps;
}

function make_the_about( $page_type = 'doc' ) {
/**
* returns an html string for the about popup.
* has variable content depending if the user is reading it on the splash page or their page.
*
* @since 1.0
*
* @caller load user index file / load splash index file
* @ingroup load index file
*
* @param (optional) set only if is called from the splash page. used to determine content.
*
* @return / @var html string $aboutPage, the about popup.
*/
	
	if ( $page_type === 'splash' ) {
		$direction = 'Click the arrow button on the main page.';
	} else {
		$direction = 'Select a new document [document icon] from the file menu at the top or the new page [plus button] that follows the editor box.';
	}
	
$aboutPage = <<< EOD
<aside id="aboutPage" class="notVisible">
	<header>
		<h1>About</h1>
	</header>
	<article>
		<h2>What is this?</h2>
		<p>This is a text editor web app can be used to create cut ups [see below] or new text documents. You can edit the document and save it to the cloud or download it as a .doc document. You can also lock the document so it can be publicly viewable but not editable.</p>
	</article>
	<article>
		<h2>What are cut ups?</h2>
		<p>The cut up technique is a chance-based literary technique in which a text is cut up and rearranged to create a new text. The concept can be traced to at least the Dadaists of the 1920s, but was popularized in the late 1950s and early 1960s by writer William S. Burroughs, and has since been used in a wide variety of contexts [<a href="https://en.wikipedia.org/wiki/Cut-up_technique" target="_blank">source</a>]. The texts used to make the cut on this site break each text down to separate lines of around 85 glyphs then folds the two sources together like shuffling a deck of cards. </p>
	</article>
	<article>
		<h2>How do I use this?</h2>
		<ol>
			<li>$direction</li>
			<li>Select your first source. This is optional. You can input text or select a source. Scroll down.</li>
			<li>Select your second source. This is optional. Scroll down.</li>
			<li>If you didn't select a source you'll get a blank document; if you selected one source the document will be just that; if you selected two different sources you'll get a cut up document.</li>
			<li>Select a name. Select a password if you'd like the document to be lockable. Click "create document".</li>
			<li>You will now see your new document.</li>
			<li>Copy the url to access it later on.</li>
		</ol>
	</article>
	<footer>
		<button type="button" tabindex="-1" class="textBtn closeAbout">close</button>
	</footer>
</aside>
<button type="button" tabindex="-1" class="menuBtn ir closeAbout x" id="aboutX">close</button>
EOD;

	return $aboutPage;
}

function make_the_editor( $dir ) {
/**
* returns an html string creating the main content: the editor options, header, toolbars, editors and page options.
* adds to the string in the order each elem will appear.
*
* @since 1.0
*
* @caller load user index file
* @calls make_the_toolbar
* @ingroup load index file
*
* @return / @var html string $editor, the editor options, header, toolbars, editors and page options
*
* @var html string $editorClassAttr, class attr determining the if the page is lockable. present if the file password.txt exists.
* @var html string $lockMenu, the lock menu. present if the file password.txt exists.
* @var string $title, the header / page title's value. found in title.txt
* @var html string $headerToolbar, the toolbar for the header
* @var html string $articles, the toggle toolbar btn, each toolbar, the text box, and page options
* @var array $pieces, list of all pages in the order they'll appear.
*
* @see make_the_toolbar 
*/
	
	try {
		$dbLogin = db_login();
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$stmt = $db->prepare( "SELECT * FROM projects WHERE directory='" . $dir . "' LIMIT 1" );
		$stmt->execute(); 
		$row = $stmt->fetch();
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
	
	if ( isset( $row[ 'password' ] ) ) {	
		$editorClassAttr = ' class="canLock"';
		
$lockMenu = <<< EOD
	<div id="toggleLockMenu" class="menu">
		<button type="button" tabindex="-1" class="ir menuBtn" id="toggleLock">toggle document locked</button>
		<div id="unlockPasswordInputWrap">
			<figure id="passwordInputError" class="notVisible"></figure>
			<input type="password" tabindex="-1" id="unlockPasswordInput" maxlength="15"/>
			<button class="ir enter menuBtn" tabindex="-1" id="unlockPassword">enter</button>
		</div>
	</div>
EOD;

	} else {
		$editorClassAttr = '';
		$lockMenu = '';
	}
	
	$title = $row[ 'title' ];
	$headerToolbar = make_the_toolbar( 'header', 'notSelected' );

$editor = <<<EOD
	<main id="editor"{$editorClassAttr}>
		<header id="articleHeader">
			$headerToolbar
			<nav id="editorOptions">
				$lockMenu
				<div id="toggleTextSrcsWrap">
					<input tabindex="-1" autocomplete="off" type="checkbox" id="toggleTextSrcs" class="ir" />
					<label id="toggleTextSrcsBtn" class="ir menuBtn"></label>
				</div>
				<div id="fileMenu" class="menu closed">
					<button tabindex="-1" type="button" class="ir menuBtn" id="folder">open folder menu</button>
					<button tabindex="-1" type="button" class="ir menuBtn" id="save">save</button>
					<button tabindex="-1" type="button" class="ir menuBtn" id="download">download this document</button>
					<button tabindex="-1" type="button" class="ir menuBtn newDoc launchCreate" id="newDocument" data-create_project="yup">new document</button>
					<button tabindex="-1" type="button" class="ir menuBtn delete" id="deleteProject">delete this document</button>
				</div>
			</nav>
			$title
		</header>
EOD;

	$articles = '<button tabindex="-1" type="button" class="ir" id="showToolbar">toggle toolbar</button>';
	$pieces = explode( '_  j  gew     jf  n_   fj    hh', $row[ 'pages' ] );
	
	$i = 0;
	$l = count( $pieces );
	
	for ( $i; $i < $l; $i = $i + 1 ) {
		$piece = $pieces[ $i ];
		$startPos = strpos( $piece, 'data-date_time="' ) + strlen( 'data-date_time="' ); 
		$id = substr( $piece, $startPos );
		$endPos = strpos( $id, '"' );
		$id = substr( $id, 0, $endPos );
		$articles = $articles . make_the_toolbar( $id, ( $i === 0 ? 'selected' : 'notSelected' ) );
		$articles = $articles . $piece;
	}
	
	$editor = $editor . $articles . '</main>';
	
	return $editor;
}

function make_the_toolbar($id, $class) {
/**
* creates a html string for the toolbar
*
* @since 1.0
*
* @caller make_doc,
*					make_the_editor
*
* @ingroup editor
*
* @param string $id a datetime or 'header'
* @param string $class 'selected' || 'notSelected'
* @return html string $editor
*/
	
$editor = <<<EOD
	<div id="toolbar-{$id}" class="toolbar {$class}">
		<select class="ql-font">
			<option autocomplete="off" value="sans-serif" selected="">Sans Serif</option>
			<option autocomplete="off" value="serif">Serif</option>
			<option autocomplete="off" value="monospace">Monospace</option>
		</select>
		<select class="ql-size">
			<option autocomplete="off" value="10px">small</option>
			<option autocomplete="off" value="13px" selected="">normal</option>
			<option autocomplete="off" value="18px">bigger</option>
			<option autocomplete="off" value="32px">large</option>
			<option autocomplete="off" value="48px">huge</option>
		</select>
		<span class="ql-format-button ql-bold"></span>
		<span class="ql-format-button ql-italic"></span>
		<select class="ql-align">
			<option autocomplete="off" value="left" selected=""></option>
			<option autocomplete="off" value="center"></option>
			<option autocomplete="off" value="right"></option>
		</select>
		<select class="ql-color">
			<option autocomplete="off" class="colorCol1Row1" value="rgb(0, 0, 0)" selected=""></option>
			<option autocomplete="off" class="colorCol2Row1" value="rgb(255, 0, 0)"></option>
			<option autocomplete="off" class="colorCol3Row1" value="rgb(255, 119, 0)"></option>
			<option autocomplete="off" class="colorCol4Row1" value="rgb(255, 255, 0)"></option>
			<option autocomplete="off" class="colorCol5Row1" value="rgb(0, 255, 0)"></option>
			<option autocomplete="off" class="colorCol6Row1" value="rgb(0, 0, 255)"></option>
			<option autocomplete="off" class="colorCol7Row1" value="rgb(255, 0, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row2" value="rgb(64, 64, 64)"></option>
			<option autocomplete="off" class="colorCol2Row2" value="rgb(255, 51, 51)"></option>
			<option autocomplete="off" class="colorCol3Row2" value="rgb(255, 146, 51)"></option>
			<option autocomplete="off" class="colorCol4Row2" value="rgb(255, 255, 51)"></option>
			<option autocomplete="off" class="colorCol5Row2" value="rgb(51, 255, 51)"></option>
			<option autocomplete="off" class="colorCol6Row2" value="rgb(51, 51, 255)"></option>
			<option autocomplete="off" class="colorCol7Row2" value="rgb(255, 51, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row3" value="rgb(128, 128, 128)"></option>
			<option autocomplete="off" class="colorCol2Row3" value="rgb(255, 102, 102)"></option>
			<option autocomplete="off" class="colorCol3Row3" value="rgb(255, 173, 102)"></option>
			<option autocomplete="off" class="colorCol4Row3" value="rgb(255, 255, 102)"></option>
			<option autocomplete="off" class="colorCol5Row3" value="rgb(102, 255, 102)"></option>
			<option autocomplete="off" class="colorCol6Row3" value="rgb(102, 102, 255)"></option>
			<option autocomplete="off" class="colorCol7Row3" value="rgb(255, 102, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row4" value="rgb(191, 191, 191)"></option>
			<option autocomplete="off" class="colorCol2Row4" value="rgb(255, 153, 153)"></option>
			<option autocomplete="off" class="colorCol3Row4" value="rgb(255, 201, 153)"></option>
			<option autocomplete="off" class="colorCol4Row4" value="rgb(255, 255, 153)"></option>
			<option autocomplete="off" class="colorCol5Row4" value="rgb(15, 255, 153)"></option>
			<option autocomplete="off" class="colorCol6Row4" value="rgb(153, 153, 255)"></option>
			<option autocomplete="off" class="colorCol7Row4" value="rgb(255, 153, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row5" value="rgb(255, 255, 255)"></option>
			<option autocomplete="off" class="colorCol2Row5" value="rgb(255, 204, 204)"></option>
			<option autocomplete="off" class="colorCol3Row5" value="rgb(255, 228, 204)"></option>
			<option autocomplete="off" class="colorCol4Row5" value="rgb(255, 255, 204)"></option>
			<option autocomplete="off" class="colorCol5Row5" value="rgb(204, 255, 204)"></option>
			<option autocomplete="off" class="colorCol6Row5" value="rgb(204, 204, 255)"></option>
			<option autocomplete="off" class="colorCol7Row5" value="rgb(255, 204, 255)"></option>
		</select>
		<select class="ql-background">
			<option autocomplete="off" class="colorCol1Row1" value="rgb(0, 0, 0)"></option>
			<option autocomplete="off" class="colorCol2Row1" value="rgb(255, 0, 0)"></option>
			<option autocomplete="off" class="colorCol3Row1" value="rgb(255, 119, 0)"></option>
			<option autocomplete="off" class="colorCol4Row1" value="rgb(255, 255, 0)"></option>
			<option autocomplete="off" class="colorCol5Row1" value="rgb(0, 255, 0)"></option>
			<option autocomplete="off" class="colorCol6Row1" value="rgb(0, 0, 255)"></option>
			<option autocomplete="off" class="colorCol7Row1" value="rgb(255, 0, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row2" value="rgb(64, 64, 64)"></option>
			<option autocomplete="off" class="colorCol2Row2" value="rgb(255, 51, 51)"></option>
			<option autocomplete="off" class="colorCol3Row2" value="rgb(255, 146, 51)"></option>
			<option autocomplete="off" class="colorCol4Row2" value="rgb(255, 255, 51)"></option>
			<option autocomplete="off" class="colorCol5Row2" value="rgb(51, 255, 51)"></option>
			<option autocomplete="off" class="colorCol6Row2" value="rgb(51, 51, 255)"></option>
			<option autocomplete="off" class="colorCol7Row2" value="rgb(255, 51, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row3" value="rgb(128, 128, 128)"></option>
			<option autocomplete="off" class="colorCol2Row3" value="rgb(255, 102, 102)"></option>
			<option autocomplete="off" class="colorCol3Row3" value="rgb(255, 173, 102)"></option>
			<option autocomplete="off" class="colorCol4Row3" value="rgb(255, 255, 102)"></option>
			<option autocomplete="off" class="colorCol5Row3" value="rgb(102, 255, 102)"></option>
			<option autocomplete="off" class="colorCol6Row3" value="rgb(102, 102, 255)"></option>
			<option autocomplete="off" class="colorCol7Row3" value="rgb(255, 102, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row4" value="rgb(191, 191, 191)"></option>
			<option autocomplete="off" class="colorCol2Row4" value="rgb(255, 153, 153)"></option>
			<option autocomplete="off" class="colorCol3Row4" value="rgb(255, 201, 153)"></option>
			<option autocomplete="off" class="colorCol4Row4" value="rgb(255, 255, 153)"></option>
			<option autocomplete="off" class="colorCol5Row4" value="rgb(15, 255, 153)"></option>
			<option autocomplete="off" class="colorCol6Row4" value="rgb(153, 153, 255)"></option>
			<option autocomplete="off" class="colorCol7Row4" value="rgb(255, 153, 255)"></option>
		
			<option autocomplete="off" class="colorCol1Row5" value="rgb(255, 255, 255)" selected=""></option>
			<option autocomplete="off" class="colorCol2Row5" value="rgb(255, 204, 204)"></option>
			<option autocomplete="off" class="colorCol3Row5" value="rgb(255, 228, 204)"></option>
			<option autocomplete="off" class="colorCol4Row5" value="rgb(255, 255, 204)"></option>
			<option autocomplete="off" class="colorCol5Row5" value="rgb(204, 255, 204)"></option>
			<option autocomplete="off" class="colorCol6Row5" value="rgb(204, 204, 255)"></option>
			<option autocomplete="off" class="colorCol7Row5" value="rgb(255, 204, 255)"></option>
		</select>
	</div>
EOD;
	
	return $editor;
}

function make_word_doc( $doc, $dir ) {
/**
* uses the $doc object to create a new word doc whose name is sent back to hte client where an <iframe> downloads it
*
* @since 1.0
*
* @caller user action
* @ingroup editor
*
* @param object $doc created in js - a big object w all the info needed
* @param string $dir the directory name to add the .doc
* @return echos the word doc's name
*/
	
	// make the a new instance of a phpword
	// you will add all the info to this
	
	$phpWord = new \PhpOffice\PhpWord\PhpWord();
	$i = 0;
	$l = count( $doc ) - 1;
	
	// loop through each page in the doc
	// each page is a 'section'
	
	for ( $i; $i < $l; $i = $i + 1 ) {
		$Paragraphs = $doc[ 'Page' . $i ];
		$ii = 0;
		$ll = count($Paragraphs) - 1;
		
		${"page_" . $i} = $phpWord->addSection();
		$Page = ${"page_" . $i};
		
		// in each page loop through each paragraph
		// style the the paragraph's alignment
		
		for ( $ii; $ii < $ll; $ii = $ii + 1 ) {
			$Spans = $Paragraphs[ 'Paragraph' . $ii ];
			$iii = 0;
			$lll = count( $Spans ) - 1;
			
			${"paragraph_" . $i . '_' . $ii} = $Page->addTextRun( array( 'align'=>$Spans[ 'align' ] ) );
			$Paragraph = ${"paragraph_" . $i . '_' . $ii};
			
			// loop through each text span
			
			for( $iii; $iii < $lll; $iii = $iii + 1 ) {
				$Span = $Spans[ 'Span' . $iii ];
				
				// create the style info for the text span
				
				$Style = array(
					'name' => $Span[ 'Styles' ][ 'name' ],
					'size' => intval( $Span[ 'Styles' ][ 'size' ] ),
					'bold' => filter_var( $Span[ 'Styles' ][ 'bold' ], FILTER_VALIDATE_BOOLEAN ),
					'italic' => filter_var( $Span[ 'Styles' ][ 'italic' ], FILTER_VALIDATE_BOOLEAN ),
					'color' => $Span[ 'Styles' ][ 'color' ],
					'fgColor' => $Span[ 'Styles' ][ 'fgColor' ]
				);
				
				// add the text span with it's style to the paragraph
				
				$Paragraph->addText( $Span[ 'text' ], $Style );
			}
		}
	}
	
	// assign it as a word doc
	
	$objWriter = \PhpOffice\PhpWord\IOFactory::createWriter( $phpWord, 'Word2007' );
	
	// create an empty word doc file w. the new file name
	
	$pathAndFile = $dir . '/' . $doc[ 'title' ] . '.docx';
	
	// save the file with content included
	
	$objWriter->save( $pathAndFile );
	
	// return the .doc's title so it can be downloaded
	
	echo( $doc[ 'title' ] . '.docx' );
	
	die();
}

function return_directory_name( $length ) {
/**
* creates a random alpha numeric string to used to create user's directory name.
* code is lifted from stack over flow, see below.
*
* @since 1.0
*
* @caller make_new_dir
* @calls make_directory_name
* @ingroup make doc
*
* @param int $length, length of directory name
*
* @return string $token, the new direcory's name
*
* @see http://stackoverflow.com/questions/1846202/php-how-to-generate-a-random-unique-alphanumeric-string/13733588#13733588
*/
	
	$token = '';
	$codeAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	
	for ( $i = 0; $i < $length; $i++ ) {
		$token = $token . $codeAlphabet[ make_directory_name( 0, strlen( $codeAlphabet ) ) ];
	}
	
	return $token;
}

function update_editor_instructions( $dir ) {
/**
* when the user x's out of the initial directions this is triggered so the user only sees the instructions once
*
* @since 1.0
*
* @caller user action
* @ingroup editor
*
* @param string $dir directory's name
*/
	
	try {
		$dbLogin = db_login();
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$sql = "UPDATE projects SET showinstructions=? WHERE directory=?";
		$query = $db->prepare( $sql );
		$query->execute( array( 0, $dir ) );
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
}

function save_doc( $dir, $title, $pages ) {
/**
* saves the doc to the database
*
* @since 1.0
*
* @caller user action
* @calls add_piece
* @ingroup editor
*
* @param string $dir the directory that is being amended
* @param string $title the new value for the title.txt
* @param object $text object with datetime keys and html string values
* @param array $order an array listing the piece text file names in the new order loaded
*/
	
	try {
		$dbLogin = db_login();
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$sql = "UPDATE projects SET title=?,pages=? WHERE directory=?";
		$query = $db->prepare( $sql );
		$query->execute( array( $title, $pages, $dir ) );
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
	
	die();
}

function split_source_into_chunks( $source ) {
/**
* breaks a source into an array of whole word chunks
*
* @since 1.0
*
* @caller combine_sources
* @ingroup make doc
*
* @return array $array
*
* @param string $source
*/
	
	$maxCharsPerLine = 85;
	$i = 0;
	
	// get make # of lines it could be. multiply by three to be safe.
	
	$l = ceil( strlen( $source ) / $maxCharsPerLine ) * 3;
	for ( $i; $i < $l; $i = $i + 1 ) {
		
		// check if strlen is less than one line long.
		// if so return it and end
		
		if ( strlen( $source ) <= $maxCharsPerLine ) {
			$array[] = $source;
			break;
		}
		
		// break off a chunk of the source
		
		$chunk = substr( $source, 0, $maxCharsPerLine );
		
		// get the position end of the last full word in the chunk
		
		$lastSpace = strrpos( $chunk, ' ' );
		
		// if it's just be long string return it
		
		if ( $lastSpace === -1 ) {
			$array[] = $chunk;
			break;
		}
		
		// clean up the chunk by trimming it to the last full word
		
		$chunk = substr( $chunk, 0, $lastSpace + 1 );
		
		// add the chunk to the array
		
		$array[] = $chunk;
		
		// remove the chunk from the source
		
		$source = substr( $source, strlen( $chunk ) );
	}
	
	return $array;
}

function try_to_unlock( $attempt, $dir ) {
/**
* tries to ulock the page. if it does, the file holding the locked state is changed.
* either way the result is sent back to the user.
*
* @since 1.0
*
* @caller ajax user action
* @ingroup try to unlock
*
* @param string $attempt, string inputed by user
* @param string $dir, the user's directory
*
* @return string $result, did the user enter the correct password
*
* @var string $password, the correct password
* @var string $result, did the user enter the correct password
*/
	
	try {
		$dbLogin = db_login();
    $db = new PDO( $dbLogin[ 'dsn' ], $dbLogin[ 'user' ], $dbLogin[ 'pass' ] );
		$db->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		$stmt = $db->prepare( "SELECT * FROM projects WHERE directory='" . $dir . "' LIMIT 1" );
		$stmt->execute(); 
		$row = $stmt->fetch();
		$password = $row['password'];
		$result = ( $attempt === $password ? 'yup' : 'nope' );
		
		echo( $result );
		
		if ( $result === 'yup' ) {
			$sql = "UPDATE projects SET islocked=? WHERE directory=?";
			$query = $db->prepare( $sql );
			$query->execute( array( 0, $dir ) );
		}
	} catch ( PDOException $e ) {
		die( 'Could not connect to the database:<br/>' . $e );
	}
	
	die();
}
?>