use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn analyze_stub(edge_count: usize) -> usize {
    edge_count
}

#[wasm_bindgen]
pub fn detect_fan_in(
    node_count: u32,
    senders: &[u32],
    receivers: &[u32],
    timestamps: &[f64],
    amounts: &[f64],
    small_threshold: f64,
    window_ms: f64,
    min_unique: u32,
) -> Vec<u32> {
    let n = node_count as usize;
    let mut buckets: Vec<Vec<(u32, f64)>> = vec![Vec::new(); n];
    for i in 0..senders.len() {
        let s = senders[i] as usize;
        let r = receivers[i] as usize;
        let t = timestamps[i];
        let a = amounts[i];
        if !t.is_finite() {
            continue;
        }
        if small_threshold > 0.0 && a > small_threshold {
            continue;
        }
        buckets[r].push((s as u32, t));
    }

    let mut result: Vec<u32> = Vec::new();
    for (receiver_idx, mut list) in buckets.into_iter().enumerate() {
        if list.len() < min_unique as usize {
            continue;
        }
        list.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
        let mut left = 0usize;
        let mut counts: HashMap<u32, u32> = HashMap::new();
        for right in 0..list.len() {
            let sid = list[right].0;
            *counts.entry(sid).or_insert(0) += 1;
            while list[right].1 - list[left].1 > window_ms {
                let lid = list[left].0;
                if let Some(c) = counts.get_mut(&lid) {
                    if *c <= 1 {
                        counts.remove(&lid);
                    } else {
                        *c -= 1;
                    }
                }
                left += 1;
            }
            if counts.len() >= min_unique as usize {
                for (sid, _) in counts.iter() {
                    result.push(receiver_idx as u32);
                    result.push(*sid);
                }
                break;
            }
        }
    }
    result
}

#[wasm_bindgen]
pub fn detect_fan_out(
    node_count: u32,
    senders: &[u32],
    receivers: &[u32],
    timestamps: &[f64],
    amounts: &[f64],
    small_threshold: f64,
    window_ms: f64,
    min_unique: u32,
) -> Vec<u32> {
    let n = node_count as usize;
    let mut buckets: Vec<Vec<(u32, f64)>> = vec![Vec::new(); n];
    for i in 0..senders.len() {
        let s = senders[i] as usize;
        let r = receivers[i] as usize;
        let t = timestamps[i];
        let a = amounts[i];
        if !t.is_finite() {
            continue;
        }
        if small_threshold > 0.0 && a > small_threshold {
            continue;
        }
        buckets[s].push((r as u32, t));
    }

    let mut result: Vec<u32> = Vec::new();
    for (sender_idx, mut list) in buckets.into_iter().enumerate() {
        if list.len() < min_unique as usize {
            continue;
        }
        list.sort_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));
        let mut left = 0usize;
        let mut counts: HashMap<u32, u32> = HashMap::new();
        for right in 0..list.len() {
            let rid = list[right].0;
            *counts.entry(rid).or_insert(0) += 1;
            while list[right].1 - list[left].1 > window_ms {
                let lid = list[left].0;
                if let Some(c) = counts.get_mut(&lid) {
                    if *c <= 1 {
                        counts.remove(&lid);
                    } else {
                        *c -= 1;
                    }
                }
                left += 1;
            }
            if counts.len() >= min_unique as usize {
                for (rid, _) in counts.iter() {
                    result.push(sender_idx as u32);
                    result.push(*rid);
                }
                break;
            }
        }
    }
    result
}

#[wasm_bindgen]
pub fn detect_cycles(
    node_count: u32,
    senders: &[u32],
    receivers: &[u32],
    min_len: u32,
    max_len: u32,
    max_paths_per_start: u32,
    max_neighbors: u32,
) -> Vec<u32> {
    let n = node_count as usize;
    let mut adj: Vec<Vec<u32>> = vec![Vec::new(); n];
    for i in 0..senders.len() {
        let s = senders[i] as usize;
        let r = receivers[i] as u32;
        if s < n {
            adj[s].push(r);
        }
    }

    let mut results: Vec<u32> = Vec::new();
    let mut seen: HashMap<String, bool> = HashMap::new();

    for start in 0..n {
        let mut path: Vec<u32> = vec![start as u32];
        let mut visited: Vec<bool> = vec![false; n];
        visited[start] = true;
        let mut path_count: u32 = 0;

        fn dfs(
            start: u32,
            current: u32,
            depth: u32,
            min_len: u32,
            max_len: u32,
            max_paths_per_start: u32,
            max_neighbors: u32,
            adj: &Vec<Vec<u32>>,
            visited: &mut Vec<bool>,
            path: &mut Vec<u32>,
            path_count: &mut u32,
            seen: &mut HashMap<String, bool>,
            results: &mut Vec<u32>,
        ) {
            if depth > max_len {
                return;
            }
            if *path_count > max_paths_per_start {
                return;
            }
            let neighbors = &adj[current as usize];
            let limit = if neighbors.len() as u32 > max_neighbors {
                max_neighbors as usize
            } else {
                neighbors.len()
            };
            for i in 0..limit {
                let next = neighbors[i];
                if next == start && depth >= min_len {
                    // Canonicalize cycle by minimal rotation
                    let cycle = path.clone();
                    let mut best = cycle.clone();
                    for r in 1..cycle.len() {
                        let mut rotated = cycle[r..].to_vec();
                        rotated.extend_from_slice(&cycle[..r]);
                        if rotated < best {
                            best = rotated;
                        }
                    }
                    let key = best
                        .iter()
                        .map(|v| v.to_string())
                        .collect::<Vec<String>>()
                        .join("|");
                    if !seen.contains_key(&key) {
                        seen.insert(key, true);
                        results.extend_from_slice(&best);
                        results.push(u32::MAX);
                    }
                    continue;
                }
                if visited[next as usize] {
                    continue;
                }
                if depth + 1 > max_len {
                    continue;
                }
                *path_count += 1;
                visited[next as usize] = true;
                path.push(next);
                dfs(
                    start,
                    next,
                    depth + 1,
                    min_len,
                    max_len,
                    max_paths_per_start,
                    max_neighbors,
                    adj,
                    visited,
                    path,
                    path_count,
                    seen,
                    results,
                );
                path.pop();
                visited[next as usize] = false;
            }
        }

        dfs(
            start as u32,
            start as u32,
            1,
            min_len,
            max_len,
            max_paths_per_start,
            max_neighbors,
            &adj,
            &mut visited,
            &mut path,
            &mut path_count,
            &mut seen,
            &mut results,
        );
    }

    results
}

#[wasm_bindgen]
pub fn detect_shell_chains(
    node_count: u32,
    senders: &[u32],
    receivers: &[u32],
    degrees: &[u32],
    max_depth: u32,
    max_paths_per_start: u32,
    max_neighbors: u32,
) -> Vec<u32> {
    let n = node_count as usize;
    let mut adj: Vec<Vec<u32>> = vec![Vec::new(); n];
    for i in 0..senders.len() {
        let s = senders[i] as usize;
        let r = receivers[i] as u32;
        if s < n {
            adj[s].push(r);
        }
    }

    let is_shell = |idx: usize| -> bool {
        let d = degrees.get(idx).cloned().unwrap_or(0);
        d >= 2 && d <= 3
    };

    let mut results: Vec<u32> = Vec::new();

    for start in 0..n {
        let mut path: Vec<u32> = vec![start as u32];
        let mut visited: Vec<bool> = vec![false; n];
        visited[start] = true;
        let mut path_count: u32 = 0;

        fn dfs(
            current: u32,
            max_depth: u32,
            max_paths_per_start: u32,
            max_neighbors: u32,
            adj: &Vec<Vec<u32>>,
            is_shell: &dyn Fn(usize) -> bool,
            visited: &mut Vec<bool>,
            path: &mut Vec<u32>,
            path_count: &mut u32,
            results: &mut Vec<u32>,
        ) {
            if (path.len() as u32) - 1 >= max_depth {
                return;
            }
            if *path_count > max_paths_per_start {
                return;
            }
            let neighbors = &adj[current as usize];
            let limit = if neighbors.len() as u32 > max_neighbors {
                max_neighbors as usize
            } else {
                neighbors.len()
            };
            for i in 0..limit {
                let next = neighbors[i];
                if visited[next as usize] {
                    continue;
                }
                *path_count += 1;
                visited[next as usize] = true;
                path.push(next);

                if path.len() >= 4 {
                    let intermediates = &path[1..path.len() - 1];
                    let mut ok = true;
                    for v in intermediates.iter() {
                        if !is_shell(*v as usize) {
                            ok = false;
                            break;
                        }
                    }
                    let last_is_shell = is_shell(*path.last().unwrap() as usize);
                    if ok && !last_is_shell {
                        for v in path.iter() {
                            results.push(*v);
                        }
                        results.push(u32::MAX);
                    }
                }

                dfs(
                    next,
                    max_depth,
                    max_paths_per_start,
                    max_neighbors,
                    adj,
                    is_shell,
                    visited,
                    path,
                    path_count,
                    results,
                );

                path.pop();
                visited[next as usize] = false;
            }
        }

        dfs(
            start as u32,
            max_depth,
            max_paths_per_start,
            max_neighbors,
            &adj,
            &is_shell,
            &mut visited,
            &mut path,
            &mut path_count,
            &mut results,
        );
    }

    results
}
