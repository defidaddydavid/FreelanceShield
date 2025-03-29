fn main() {
    // Tell cargo to rerun this build script if build.rs changes
    println!("cargo:rerun-if-changed=build.rs");
    
    // Set cfg flags to help with borsh compatibility
    println!("cargo:rustc-cfg=has_borsh_serialization");
    
    // Allow conditional compilation for working around missing trait implementations
    println!("cargo:rustc-cfg=fix_borsh_traits");
}
