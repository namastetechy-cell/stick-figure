# What if your computer moved 10,000 GB every second? (35 s, 9:16)

## Facts (sources)
- Fast consumer NVMe SSDs read ~7 GB/s (PCIe 4.0, e.g. Samsung 990 Pro 7.45 GB/s) to ~14 GB/s (PCIe 5.0). "About ten" is the midpoint. 10,000 / 10 = 1,000x. (Samsung / Crucial T705 spec sheets)
- A ~150 GB game at 10,000 GB/s = 0.015 s = 15 ms. A human blink lasts ~100-400 ms. (Harvard BioNumbers: blink duration 100-400 ms)
- 150 GB over a ~300 Mbit/s home connection = 4,000 s ≈ 1.1 h. (Ookla Speedtest Global Index: US median fixed download ~280-300 Mbit/s, 2025)
- Light in vacuum travels 29.98 cm in one nanosecond (c = 299,792,458 m/s). Grace Hopper's famous "nanosecond" wire was 11.8 in.
- Nvidia B200 GPU: 8 TB/s HBM3e memory bandwidth = 8,000 GB/s. HBM stacks memory right beside the GPU die on the same package to shorten the wires. (Nvidia B200 / DGX B200 datasheet)

## Voice-over
What if your computer could move ten thousand gigabytes a second?
A fast SSD today manages about ten. That's a thousand times faster.
At ten thousand, a huge game installs in fifteen milliseconds. Faster than a blink.
Luckily, your computer is ready. Unluckily, your Wi-Fi would still take an hour.
And there's one limit nobody can patch: light.
In a nanosecond, it travels just thirty centimetres.
So engineers put memory right beside the chip, like snacks on your desk, not in the kitchen.
The wild part? Top AI chips already move about eight thousand gigabytes a second.
The future's here. It's just waiting on your Wi-Fi.
