// Windows 生产构建时隐藏控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    gach_desktop_lib::run();
}
