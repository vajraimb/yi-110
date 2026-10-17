(* Six-cell ring for the 256 elementary rules.
   Bit 0 is 初爻. Neighborhood k = left lsl 2 + center lsl 1 + right.
   A rule swallows hexagrams when more than four of the 64 states
   visit 坤 within 64 steps.
   The unsettled family is NOT the six pure permutations
   15, 51, 85, 170, 204 and 240. It is the rules whose ring graph
   has cycle length 6, image 32 and 16 states left after 45 steps:
   60, 102, 153 and 195.
   The fixed-point family is not rule 204. JS keeps 196 and 236:
   they move, then rest, and the planted window still differs from the control.
   JS has run the tape acceptance. This file has not been compiled here,
   so the OCaml figures are not yet checked against the JS hash. *)

let ring_next rule state =
  let out = ref 0 in
  for i = 0 to 5 do
    let left = (state lsr ((i + 5) mod 6)) land 1 in
    let center = (state lsr i) land 1 in
    let right = (state lsr ((i + 1) mod 6)) land 1 in
    let nb = (left lsl 2) lor (center lsl 1) lor right in
    if (rule lsr nb) land 1 = 1 then out := !out lor (1 lsl i)
  done;
  !out

let kun_basin rule =
  let n = ref 0 in
  for s = 0 to 63 do
    let x = ref s in
    let t = ref 0 in
    let hit = ref (!x = 0) in
    while (not !hit) && !t < 64 do
      x := ring_next rule !x;
      t := !t + 1;
      if !x = 0 then hit := true
    done;
    if !hit then n := !n + 1
  done;
  !n

let max_cycle rule =
  let best = ref 1 in
  for s = 0 to 63 do
    let seen = Hashtbl.create 16 in
    let x = ref s in
    let t = ref 0 in
    let stop = ref false in
    while not !stop do
      match Hashtbl.find_opt seen !x with
      | Some t0 ->
          best := max !best (!t - t0);
          stop := true
      | None ->
          Hashtbl.add seen !x !t;
          x := ring_next rule !x;
          t := !t + 1;
          if !t > 80 then stop := true
    done
  done;
  !best

let image_size rule =
  let seen = Array.make 64 false in
  let n = ref 0 in
  for s = 0 to 63 do
    let y = ring_next rule s in
    if not seen.(y) then (seen.(y) <- true; n := !n + 1)
  done;
  !n

let swallows rule = kun_basin rule > 4

let late_count rule =
  let seen = Array.make 64 false in
  let n = ref 0 in
  for s = 0 to 63 do
    let x = ref s in
    for _ = 1 to 45 do
      x := ring_next rule !x
    done;
    if not seen.(!x) then (seen.(!x) <- true; n := !n + 1)
  done;
  !n

let () =
  List.iter
    (fun r -> Printf.printf "lai %d basin %d swallow %b\n" r (kun_basin r) (swallows r))
    [ 0; 4; 32; 36 ];
  Printf.printf "settle";
  for rule = 0 to 255 do
    let basin = kun_basin rule in
    let cyc = max_cycle rule in
    let late = late_count rule in
    if basin <= 1 && cyc = 1 && late >= 16 && rule <> 0 && rule <> 255 then
      Printf.printf " %d" rule
  done;
  Printf.printf "\nopen";
  let perm r = List.mem r [ 15; 51; 85; 170; 204; 240 ] in
  for rule = 0 to 255 do
    let basin = kun_basin rule in
    let cyc = max_cycle rule in
    let late = late_count rule in
    let img = image_size rule in
    if (not (perm rule)) && basin <= 4 && cyc = 6 && img = 32 && late = 16 then
      Printf.printf " %d" rule
  done;
  print_newline ()

