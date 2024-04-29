use std::io::{stdin, stdout, Write};
use termion::event::Key;
use termion::input::TermRead;
use termion::raw::IntoRawMode;

use zk::game::{get_fib_number_0, get_fib_number_1, init_game, step, GameState};

fn print_number(stdout: &mut std::io::Stdout) {
    let nubmer0 = get_fib_number_0();
    let nubmer1 = get_fib_number_1();
    writeln!(stdout, "Fib number: {} {}\r", nubmer0, nubmer1).unwrap();
}

fn main() {
    let stdin = stdin();
    let mut stdout = stdout().into_raw_mode().unwrap();

    init_game();
    writeln!(
        stdout,
        "Use <- (left arrow) and -> (right arrow) to control the game, q to quit.\r"
    )
    .unwrap();
    print_number(&mut stdout);

    for c in stdin.keys() {
        match c.unwrap() {
            Key::Left => step(0),
            Key::Right => step(1),
            Key::Char('q') => break, // Quit the game
            _ => continue,
        }
        print_number(&mut stdout);
    }
}
