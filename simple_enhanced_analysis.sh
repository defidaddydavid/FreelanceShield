#!/bin/bash

# Create output directory
mkdir -p diagrams/enhanced

# Set the base directory for analysis
BASE_DIR="/Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts"

# Generate program structure analysis
echo "Generating program structure analysis..."

# Find all Rust files
find "$BASE_DIR" -name "*.rs" > all_rust_files.txt

# Analyze central modules
echo "# Central Modules in the Codebase" > diagrams/enhanced/central_modules.md
echo "" >> diagrams/enhanced/central_modules.md
echo "Modules are ranked by their centrality (incoming + outgoing dependencies):" >> diagrams/enhanced/central_modules.md
echo "" >> diagrams/enhanced/central_modules.md

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

# Generate program-specific dependency analysis
echo "Generating program-specific dependency analysis..."
echo "# Program-Specific Dependency Analysis" > diagrams/enhanced/program_dependencies.md
echo "" >> diagrams/enhanced/program_dependencies.md

# Analyze each program
for program_dir in "$BASE_DIR/programs/"*/; do
  program=$(basename "$program_dir")
  
  echo "## $program Program" >> diagrams/enhanced/program_dependencies.md
  echo "" >> diagrams/enhanced/program_dependencies.md
  
  # Count files
  file_count=$(find "$program_dir" -name "*.rs" | wc -l | tr -d ' ')
  echo "Contains $file_count Rust files" >> diagrams/enhanced/program_dependencies.md
  echo "" >> diagrams/enhanced/program_dependencies.md
  
  # Find external dependencies
  echo "### External Dependencies" >> diagrams/enhanced/program_dependencies.md
  find "$program_dir" -name "*.rs" | xargs grep -h "^use" | grep -v "crate\|super\|self" | sort | uniq -c | sort -nr | head -10 | sed 's/^ */- `/' | sed 's/$/`/' >> diagrams/enhanced/program_dependencies.md
  echo "" >> diagrams/enhanced/program_dependencies.md
  
  # Find internal dependencies (other programs)
  echo "### Cross-Program Dependencies" >> diagrams/enhanced/program_dependencies.md
  for other_program in $(ls -1 "$BASE_DIR/programs/"); do
    if [ "$other_program" != "$program" ]; then
      count=$(find "$program_dir" -name "*.rs" | xargs grep -l "$other_program" | wc -l | tr -d ' ')
      if [ "$count" -gt 0 ]; then
        echo "- Depends on \`$other_program\` in $count files" >> diagrams/enhanced/program_dependencies.md
      fi
    fi
  done
  echo "" >> diagrams/enhanced/program_dependencies.md
done

# Clean up temporary files
rm -f all_rust_files.txt temp_centrality.txt temp_importers.txt

echo "Enhanced analysis complete! Check the diagrams/enhanced directory for results."
