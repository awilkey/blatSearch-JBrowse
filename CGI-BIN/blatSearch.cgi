#!/usr/bin/perl
#
#   sequenceSearch.pl-- standard "hello, world" program to demonstrate basic
#       CGI programming, and the use of the &getcgivars() routine.
#

# First, get the CGI variables into a list of strings
use strict;
use warnings;

use CGI;

my $cgi = new CGI;
my $op = $cgi->param("operation");

#my $main_conf = read_conf('plugin.conf');
my $path = $0;
$path =~ m/^(.*)(\\|\/)(.*)\.([a-z]*)/;
my $run_dir = $1;
my $main_conf = read_conf("$run_dir/../conf/plugin.conf");

if( $op eq "get_tools"){
 	
 	my $tools;
 	foreach my $section(keys %{$main_conf}){
 			if(defined $main_conf->{$section}->{key}){ 
 				$tools .= '"'.$main_conf->{$section}->{key}.'",';
 			} else {		
 				$tools .= '"'.$section.'",';
 			}
 	}
 	chop($tools);
 	
 	print $cgi->header(-type=>"application/json",-charset =>"utf-8" );
 	print '{"search_tools":['.$tools.']}';
 	exit ;
 }


my $type = check_seq($cgi->param('sequence'));

if ($type eq "invalid"){
	print $cgi->header(-type=>"application/json", -charset => "utf-8");
	print '{"warning":"invalid"}';
	exit;
}


my $outfile = run_search($cgi,$main_conf);

my $matches = read_psl($outfile);

my $results = matches_to_JSON($cgi,$matches);


print $cgi->header(-type=>"application/json",-charset =>"utf-8" );
print <<END_JSON;
{"matches":[$$results]}
END_JSON

exit ;


#=============================================================================#
#	SUBROUTINES		 														  #
#=============================================================================#

# read in configuration file.
sub read_conf{
	my $file = shift;
	
	local $/ = undef;

	open(my $fh,'<',$file) or die "Can't open $file: $!";
	my $file_contents = <$fh>;
	close($fh);
	
	my $section ='_';
	my $conf;	
	
	foreach(split( /(?:\r{1,2}\n|\r|\n)/, $file_contents)){
		
		next if /^\s*(?:\#|\;|$)/;
		
		s/\s\;\s.+$//g;

		if( /^\s*\[\s*(.+?)\s*\]\s*$/ ){
			$conf->{$section=$1} ||={};
			next;
		}
	
		if (/^\s*([^=]+?)\s*=\s*(.*?)\s*$/) {
			$conf->{$section}->{$1} =$2;
			next;
		}
	
	}
	
	return $conf;
}

# makes sure inputed sequence is sanitary
sub check_seq{
	my $query = shift;
	$query = uc $query;

	if ($query =~ /^[AGCTUSFLY_WLPHQRIMTNKSRVADEG]/i) {return "valid";}
  	return "invalid";
}

# Called as run_search($cgi,$main_conf)
# Generates and runs search
sub run_search{

	my $search = shift;
	my $main_conf = shift;
	
	my $tool = $search->param('key');
	my $dataset = $search->param('dataset');	
	my $min_ident = $search->param('minIdent');

	my @flags;
	my $conf_loc;
	my @cmd;

	foreach my $section(keys %{$main_conf}){
		if(($section eq $tool) or ($main_conf->{$section}->{key} eq $tool)){ 
			push @flags, $main_conf->{$section}->{flags};
			$conf_loc = $main_conf->{$section}->{config};
			$search->{toolConf} = $conf_loc;
			last; 
		}
	}

	 my $tool_conf = read_conf("$run_dir/$conf_loc");

	foreach my $section (keys %{$tool_conf}){
		if ($section eq "general"){
			push @flags, $tool_conf->{$section}->{flags};
		} elsif ($section eq $dataset){
			if (length($tool_conf->{$section}->{flags})){
				pop @flags;
				push @flags, $tool_conf->{$section}->{flags};
			}
		}
	}

	my $general = $tool_conf->{general};
	$dataset = $tool_conf->{$dataset};

	my	$input = $search->param('sequence');
	

	push @cmd, 'printf  '."\">test \n $input\"".' | ';	
	push @cmd, $general->{bin};
	push @cmd, join(' ',@flags);
	push @cmd, "-minIdentity=".$min_ident;
	push @cmd, $dataset->{host};
	push @cmd, $dataset->{port};
	push @cmd, $dataset->{path};	
	push @cmd, '/dev/stdin';
	push @cmd, '/dev/stdout';
	push @cmd, '2>&1';
	my @output = split("\n",`@cmd`);
	return \@output;

}


sub matches_to_JSON{
	my $cgi = shift;
 	my $matches = shift;

	@$matches = sort{	$b->{score} <=> $a->{score} or
    	                $b->{id} <=> $a->{id} or
						$a->{name} cmp $b->{name} or
						$a->{start} <=> $b->{start} } @$matches;


	my $json;
	my $maxHits = $cgi->param('maxHits');
    $maxHits = $maxHits <= keys @$matches ? $maxHits : keys @$matches;
	my $a;

	my $searchall = $cgi->param('searchAll');
	my $refseq = $cgi->param('refSeq');	

	while ($a=shift(@$matches)) {
		if(	($searchall eq "false" or
			$refseq eq $a->{name}) and
            $maxHits > 0 ){
 				
			$json .= '{"start":'.$a->{start}.',"end":'.
 			$a->{end}.',"name":"'.$a->{name}.'","score":'.$a->{score}.
 			',"id":'.$a->{id}.'},';
            
            $maxHits --;
        }
 	}
 
	chop($json);

	return \$json;
}
#=============================================================================#
#	PSL file handling														  #
#=============================================================================#


# called as read_psl($output_file);
#parses outputFile, assuming psl format
sub	read_psl{
 	my $outfile = shift;
 	my @results;
 
	my @outfile = @$outfile;
	my @line;
	
	
	my $id;
	my $score;
	my $rec = {};

	foreach my $current (@outfile){
		@line = split("\t",$current);
		if($line[15]){	# Check that current line contains a feature
			$id = calc_identity(\@line);
			$score = calc_score(\@line);
        	
			if ($line[15] < $line[16]){
            	($line[15],$line[16]) = ($line[16], $line[15]);
        	}
			
			push @results, { id	=>$id,
							 score	=>	$score,
							 start	=>	$line[16],
							 end	=>	$line[15],
							 name	=>	$line[13]};
		}
	}	
 	return \@results;
}	

sub calc_identity{
	#look up calculation requirement, remove field temp if not cooperative
	my $psl = shift;
    my $id = 100.00 - calc_mili_bad($psl) *0.1;
    return sprintf("%.2f",$id);
}

sub calc_mili_bad{
	my $array = shift;

	my @psl = @$array;

	my ($qAliSize,$tAliSize, $aliSize);
	my $miliBad = 0;
	my $sizeDiff;
	my $insertFactor;
	my $total;

	$qAliSize = $psl[12]-$psl[11];
	$tAliSize = $psl[16]-$psl[15];
	$aliSize = $qAliSize >= $tAliSize ? $tAliSize : $qAliSize;

	if ($aliSize <=0){ return 0;}

	$sizeDiff = $qAliSize - $tAliSize;
	
	if($sizeDiff < 0){
		$sizeDiff = 0;
	}

	$insertFactor = $psl[4];

	$total = $psl[0]+$psl[2]+$psl[1];
	if ($total !=0){
		$miliBad = (1000 *( $psl[1] + $insertFactor + int(3*log(1+$sizeDiff))))/$total;
	}
	return $miliBad;
}
	
sub calc_score{
	my $array = shift;
	my @psl = @$array;
	my $match = $psl[0];
	my $mismatch = $psl[1];
	my $repmatch = $psl[2];
	my $qNumInsert = $psl[4];
	my $tNumInsert = $psl[8];

	return ($match - ($repmatch>>1)) - $mismatch - $qNumInsert - $tNumInsert;
}
