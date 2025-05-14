#!/bin/bash

# Create output directory
mkdir -p diagrams/enhanced

# Set the base directory for analysis
BASE_DIR="/Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts"

# Define colors for different programs
declare -A program_colors
program_colors["core"]="lightblue"
program_colors["freelance-insurance"]="lightgreen"
program_colors["reputation-program"]="lightsalmon"
program_colors["risk-pool-program"]="lightpink"
program_colors["claims-processor"]="lightyellow"
program_colors["policy-nft"]="lightcyan"
program_colors["dao-governance"]="lavender"
program_colors["staking-program"]="paleturquoise"

# Generate hierarchical program structure
echo "Generating hierarchical program structure..."
echo "digraph G {" > diagrams/enhanced/program_hierarchy.dot
echo "  rankdir=TB;" >> diagrams/enhanced/program_hierarchy.dot
echo "  compound=true;" >> diagrams/enhanced/program_hierarchy.dot
echo "  node [shape=box, style=filled];" >> diagrams/enhanced/program_hierarchy.dot
echo "  edge [color=gray];" >> diagrams/enhanced/program_hierarchy.dot

# Create subgraphs for each program
for program in "${!program_colors[@]}"; do
  echo "  subgraph cluster_$program {" >> diagrams/enhanced/program_hierarchy.dot
  echo "    label=\"$program\";" >> diagrams/enhanced/program_hierarchy.dot
  echo "    style=filled;" >> diagrams/enhanced/program_hierarchy.dot
  echo "    color=white;" >> diagrams/enhanced/program_hierarchy.dot
  echo "    fillcolor=${program_colors[$program]};" >> diagrams/enhanced/program_hierarchy.dot
  echo "    node [style=filled, fillcolor=white];" >> diagrams/enhanced/program_hierarchy.dot
  
  # Find all Rust files in this program
  find "$BASE_DIR/programs/$program" -name "*.rs" | while read -r file; do
    rel_path=$(echo "$file" | sed "s|$BASE_DIR/programs/$program/||")
    module_name=$(basename "$file" .rs)
    node_id="${program}_${module_name}"
    echo "    \"$node_id\" [label=\"$module_name\"];" >> diagrams/enhanced/program_hierarchy.dot
  done
  
  echo "  }" >> diagrams/enhanced/program_hierarchy.dot
done

# Add cross-program dependencies
echo "Adding cross-program dependencies..."
for program in "${!program_colors[@]}"; do
  find "$BASE_DIR/programs/$program" -name "*.rs" | while read -r file; do
    src_module=$(basename "$file" .rs)
    src_node="${program}_${src_module}"
    
    # Look for imports of other programs
    for target_program in "${!program_colors[@]}"; do
      if [ "$target_program" != "$program" ]; then
        grep -i "$target_program" "$file" | grep -i "use\|import\|mod" > /dev/null
        if [ $? -eq 0 ]; then
          echo "  \"$src_node\" -> \"${target_program}_lib\" [lhead=cluster_$target_program, ltail=cluster_$program, color=red, penwidth=2];" >> diagrams/enhanced/program_hierarchy.dot
        fi
      fi
    done
  done
done

echo "}" >> diagrams/enhanced/program_hierarchy.dot

# Generate central module analysis
echo "Analyzing central modules..."
echo "# Central Modules in the Codebase" > diagrams/enhanced/central_modules.md
echo "" >> diagrams/enhanced/central_modules.md
echo "Modules are ranked by their centrality (incoming + outgoing dependencies):" >> diagrams/enhanced/central_modules.md
echo "" >> diagrams/enhanced/central_modules.md

# Find all Rust files
find "$BASE_DIR" -name "*.rs" > all_rust_files.txt

# Analyze each file for centrality
while read -r file; do
  module_name=$(basename "$file" .rs)
  rel_path=$(echo "$file" | sed "s|$BASE_DIR/||")
  program=$(echo "$rel_path" | cut -d'/' -f2)
  
  # Count incoming dependencies (how many files import this module)
  incoming=$(grep -l "$module_name" $(cat all_rust_files.txt) | wc -l | tr -d ' ')
  
  # Count outgoing dependencies (how many modules this file imports)
  outgoing=$(grep -E "^use |^mod " "$file" | wc -l | tr -d ' ')
  
  # Calculate centrality score
  centrality=$((incoming + outgoing))
  
  if [ "$centrality" -gt 5 ]; then
    echo "$centrality,$program,$rel_path,$module_name,$incoming,$outgoing" >> temp_centrality.txt
  fi
done < all_rust_files.txt

# Sort by centrality and create markdown
sort -nr -t, -k1 temp_centrality.txt | head -15 | while IFS=, read -r centrality program path module incoming outgoing; do
  echo "## $module (Program: $program)" >> diagrams/enhanced/central_modules.md
  echo "**Centrality Score: $centrality** (Incoming: $incoming, Outgoing: $outgoing)" >> diagrams/enhanced/central_modules.md
  echo "Path: \`$path\`" >> diagrams/enhanced/central_modules.md
  echo "" >> diagrams/enhanced/central_modules.md
  echo "### Summary" >> diagrams/enhanced/central_modules.md
  head -20 "$BASE_DIR/$path" | grep -v "^use\|^//\|^#\|^mod\|^pub mod" | tr -d '\n' | cut -c 1-300 | sed 's/$/.../' >> diagrams/enhanced/central_modules.md
  echo "" >> diagrams/enhanced/central_modules.md
  
  # Show incoming dependencies
  if [ "$incoming" -gt 0 ]; then
    echo "### Imported by ($incoming modules)" >> diagrams/enhanced/central_modules.md
    grep -l "$module_name" $(cat all_rust_files.txt) | sed "s|$BASE_DIR/||" | sort | head -5 | sed 's/^/- `/' | sed 's/$/`/' >> diagrams/enhanced/central_modules.md
    echo "" >> diagrams/enhanced/central_modules.md
  fi
  
  # Show outgoing dependencies
  if [ "$outgoing" -gt 0 ]; then
    echo "### Imports ($outgoing modules)" >> diagrams/enhanced/central_modules.md
    grep -E "^use |^mod " "$BASE_DIR/$path" | head -5 | sed 's/^/- `/' | sed 's/$/`/' >> diagrams/enhanced/central_modules.md
    echo "" >> diagrams/enhanced/central_modules.md
  fi
done

# Identify potential circular dependencies
echo "Identifying potential circular dependencies..."
echo "# Potential Circular Dependencies" > diagrams/enhanced/circular_dependencies.md
echo "" >> diagrams/enhanced/circular_dependencies.md

while read -r file1; do
  module1=$(basename "$file1" .rs)
  rel_path1=$(echo "$file1" | sed "s|$BASE_DIR/||")
  
  # Find files that import this module
  grep -l "$module1" $(cat all_rust_files.txt) > temp_importers.txt
  
  # Check if any of these importers are imported by the original module
  while read -r file2; do
    if [ "$file1" != "$file2" ]; then
      module2=$(basename "$file2" .rs)
      rel_path2=$(echo "$file2" | sed "s|$BASE_DIR/||")
      
      # Check if module1 imports module2
      grep -E "use .*$module2|mod $module2" "$file1" > /dev/null
      if [ $? -eq 0 ]; then
        echo "- **Circular dependency detected**: \`$rel_path1\` ⟷ \`$rel_path2\`" >> diagrams/enhanced/circular_dependencies.md
      fi
    fi
  done < temp_importers.txt
done < all_rust_files.txt

# Clean up temporary files
rm -f all_rust_files.txt temp_centrality.txt temp_importers.txt

echo "Enhanced analysis complete! Check the diagrams/enhanced directory for results."
