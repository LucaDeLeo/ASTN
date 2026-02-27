const COMMANDS: &[&str] = &[
    "initialize",
    "set_client_authorization_header",
    "get_client_authorization_header",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS).build();
}
