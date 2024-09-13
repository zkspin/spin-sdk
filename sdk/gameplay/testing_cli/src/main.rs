use std::io::{ stdin, stdout, Write };
use termion::event::Key;
use termion::input::TermRead;
use std::io;
fn read_number() -> Option<u64> {
    loop {
        let mut input = String::new();

        io::stdin().read_line(&mut input).expect("Failed to read line");

        if input.trim().to_lowercase() == "q" {
            return None;
        }

        match input.trim().parse::<u64>() {
            Ok(num) => {
                return Some(num);
            }
            Err(_) => println!("Invalid input, please enter a number"),
        }

        println!("Enter a number: ");
    }
}

use provable_game_logic::spin::SpinGame;
use provable_game_logic::spin::SpinGameTrait;
use provable_game_logic::definition::STATE_SIZE;

fn print_game_state(stdout: &mut std::io::Stdout) {
    let final_game_state = SpinGame::get_game_state();
    writeln!(stdout, "Game State: {:?}\r", final_game_state).unwrap();
}

const GAME_INSTRUCTIONS: &str = "Enter commands sent to step, q to quit.\r";

fn main() {
    let mut stdout = stdout();

    writeln!(stdout, "{}\r", "Welcome to Spin Game").unwrap();
    writeln!(stdout, "Expecting {} states. Enter states:\r", STATE_SIZE).unwrap();

    // Read STATE_SIZE inputs from stdin
    let mut initial_state = Vec::new();

    for _ in 0..STATE_SIZE {
        // check if -1
        let _input = read_number();

        if _input == None {
            writeln!(stdout, "Exiting...\r").unwrap();
            return;
        }
        // push to initial_state
        initial_state.push(_input.unwrap());
    }

    writeln!(stdout, "Game started with states: {:?}\r", initial_state).unwrap();

    SpinGame::initialize_game(initial_state);

    writeln!(stdout, "{}", GAME_INSTRUCTIONS).unwrap();
    print_game_state(&mut stdout);

    loop {
        let _input = read_number();

        match _input {
            None => {
                writeln!(stdout, "Exiting...\r").unwrap();
                return;
            }
            _ => {
                SpinGame::step(_input.unwrap());
                print_game_state(&mut stdout);
            }
        }
    }
}
