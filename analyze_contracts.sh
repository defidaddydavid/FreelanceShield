#!/bin/bash

# Create output directory
mkdir -p diagrams

# Set the base directory for analysis
BASE_DIR="/Users/davidknezevic/Projects/FreelanceShield/freelance-safeguard-contracts"

# Find all Rust files
echo "Finding all Rust files..."
find "$BASE_DIR" -name "*.rs" > rust_files.txt

# Analyze module dependencies
echo "Analyzing module dependencies..."
echo "digraph G {" > diagrams/module_dependencies.dot
echo "  rankdir=LR;" >> diagrams/module_dependencies.dot
echo "  node [shape=box, style=filled, fillcolor=lightblue];" >> diagrams/module_dependencies.dot

# Process each Rust file
while read -r file; do
  module_name=$(basename "$file" .rs)
  echo "Processing $module_name..."
  
  # Extract use statements
  grep -E "^use " "$file" | grep -v "use super" | grep -v "use crate" > temp_uses.txt
  
  # Extract mod statements
  grep -E "^mod " "$file" | grep -v "mod tests" >> temp_mods.txt
  
  # Create nodes and edges
  if [ -s temp_uses.txt ] || [ -s temp_mods.txt ]; then
    echo "  \"$module_name\" [label=\"$module_name\"];" >> diagrams/module_dependencies.dot
    
    while read -r use_stmt; do
      # Extract the module being used
      used_module=$(echo "$use_stmt" | sed -E 's/use ([^:;]+).*$/\1/' | tr -d ' ')
      if [ ! -z "$used_module" ]; then
        echo "  \"$module_name\" -> \"$used_module\" [color=blue];" >> diagrams/module_dependencies.dot
      fi
    done < temp_uses.txt
    
    while read -r mod_stmt; do
      # Extract the module being declared
      declared_module=$(echo "$mod_stmt" | sed -E 's/mod ([^;]+);/\1/' | tr -d ' ')
      if [ ! -z "$declared_module" ]; then
        echo "  \"$module_name\" -> \"$declared_module\" [color=green];" >> diagrams/module_dependencies.dot
      fi
    done < temp_mods.txt
  fi
  
  rm -f temp_uses.txt temp_mods.txt
done < rust_files.txt

echo "}" >> diagrams/module_dependencies.dot

# Generate a list of important files based on imports
echo "Generating list of important files..."
echo "# Most Important Files in the Codebase" > diagrams/important_files.md
echo "" >> diagrams/important_files.md
echo "Files are ranked by number of times they are imported by other files:" >> diagrams/important_files.md
echo "" >> diagrams/important_files.md

# Count imports for each file
for file in $(cat rust_files.txt); do
  module_name=$(basename "$file" .rs)
  module_path=$(echo "$file" | sed "s|$BASE_DIR/||")
  count=$(grep -l "use .*$module_name" $(cat rust_files.txt) | wc -l | tr -d ' ')
  if [ "$count" -gt 0 ]; then
    echo "$count,$module_path,$module_name" >> temp_imports.txt
  fi
done

# Sort by import count and create markdown
sort -nr -t, -k1 temp_imports.txt | head -20 | while IFS=, read -r count path module; do
  echo "## $module ($count imports)" >> diagrams/important_files.md
  echo "Path: \`$path\`" >> diagrams/important_files.md
  echo "" >> diagrams/important_files.md
  echo "### Summary" >> diagrams/important_files.md
  echo "$(head -10 "$BASE_DIR/$path" | grep -v "^use" | grep -v "^//" | tr -d '\n' | cut -c 1-200)..." >> diagrams/important_files.md
  echo "" >> diagrams/important_files.md
  echo "### Imported by" >> diagrams/important_files.md
  grep -l "use .*$module" $(cat rust_files.txt) | sed "s|$BASE_DIR/||" | sort | head -5 | sed 's/^/- `/' | sed 's/$/`/' >> diagrams/important_files.md
  echo "" >> diagrams/important_files.md
done

rm -f temp_imports.txt rust_files.txt

echo "Analysis complete! Check the diagrams directory for results."
