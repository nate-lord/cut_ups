<?php 
	include 'functions.php';
	echo make_doc_head();
	echo make_pop_ups( 'splash' );
	echo make_the_about( 'splash' );
?>
	<section id="splash">
		<span class="ir btn logo" id="mainLogo">cut ups</span>
		<figure id="splashInnerWrap">
			<div id="splashCanvas">
				<div class="pageImgWrap small notVisible" id="leftPageImg">
					<?php
						echo '<?xml version="1.0" encoding="utf-8"?>';
						include 'styles/imgs/smallPageCode.svg'; 
					?>
				</div>
				<div class="pageImgWrap large notVisible" id="centerPageImg">
					<?php
						echo '<?xml version="1.0" encoding="utf-8"?>';
						include 'styles/imgs/largePageCode.svg'; 
					?>
				</div>
				<object id="staticLargePageImg" class="hidden" >
					<?php
						echo '<?xml version="1.0" encoding="utf-8"?>';
						include 'styles/imgs/largePageStatic.svg'; 
					?>
				</object>
				<div class="pageImgWrap small notVisible" id="rightPageImg">
					<?php
						echo '<?xml version="1.0" encoding="utf-8"?>';
						include 'styles/imgs/smallPageCode.svg'; 
					?>
				</div>
			</div>
			<figcaption id="projectFeatures" class="styleMono">
				<span class="projectFeature current">make a cut up from two sources</span>
				<span class="projectFeature notCurrent">or start with a blank doc</span>
				<span class="projectFeature notCurrent">manipulate the text</span>
				<span class="projectFeature notCurrent">save to the cloud or download</span>
				<span class="projectFeature notCurrent">click the arrow to continue</span>
			</figcaption>
			<button type="button" class="ir btn launchCreate" id="createProjectFromSplash" data-create_project="yup">create a project</button>
		</figure>
	</section>
<?php
	echo make_doc_form( '' );
	echo make_doc_footer();
?>