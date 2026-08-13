// 智造3D · 主流笔式旋转纹身机（工厂打样版）
// 对标 Cheyenne Hawk Pen / FK Irons Flux 的有线 RCA 笔形 OEM 形态。
//
// 打印零件（print_part）：housing_left / housing_right / grip_sleeve /
//   cartridge_nose / rca_cap / cam / needle_bar / cable_clip
// 外购件：φ16 空心杯电机、复位弹簧、RCA 母座、线性铜套、M2.5 沉头螺钉、PCB、一次性卡式针头。
// FDM：0.4 喷嘴、0.2 层高、4 圈墙、25% gyroid；壳体 RCA 朝下竖打；凸轮建议尼龙或 POM。
// 装配间隙已含：轴孔 +0.25、螺钉过孔 +0.2、止口 0.15。

$fn = 48;

/* [整体] */
// 机身长度
body_length = 132;            // [110:1:160]
// 握把直径
grip_diameter = 25;           // [20:0.5:32]
// 壁厚
wall_thickness = 1.6;         // [1.4:0.1:2.4]
// 剖切开关
cutaway = true;
// 视窗开关
window_open = true;
// 爆炸间距
explode = 0;                  // [0:1:24]
// 导出零件
print_part = "assembly";      // [assembly, housing_left, housing_right, grip_sleeve, cartridge_nose, rca_cap, cam, needle_bar, cable_clip]

/* [驱动机构] */
// 偏心距
cam_eccentricity = 1.5;       // [1.0:0.1:2.2]
// 电机直径
motor_diameter = 16;          // [14:0.5:20]
// 电机长度
motor_length = 24;            // [18:1:30]
// 针杆显示行程比
stroke_preview = 0.5;         // [0:0.05:1]

/* [滚花] */
// 滚花节距
knurl_pitch = 1.6;            // [1.2:0.1:2.4]
// 滚花深度
knurl_depth = 0.35;           // [0.2:0.05:0.6]
// 显示滚花
show_knurl = true;

/* [颜色] */
// 外壳颜色
shell_color = "#2C2C2E";
// 握把颜色
grip_color = "#1A1A1A";
// 鼻锥颜色
nose_color = "#3A3A3C";
// 电机颜色
motor_color = "#111111";
// 凸轮颜色
cam_color = "Silver";
// 针杆颜色
bar_color = "LightSteelBlue";
// 弹簧颜色
spring_color = "Gold";
// 卡式针头颜色
cartridge_color = "#D8D8D8";

// ---------------------------------------------------------------------------
// 分段：总长按比例分配，电机舱至少能放下电机 + PCB
function rca_h() = body_length * 0.105;
function motor_h() = max(motor_length + 10, body_length * 0.275);
function shoulder_h() = body_length * 0.06;
function taper_h() = body_length * 0.11;
function nose_h() = body_length * 0.095;
function grip_h() = body_length - rca_h() - motor_h() - shoulder_h() - taper_h() - nose_h();

function z_rca() = 0;
function z_motor() = rca_h();
function z_shoulder() = z_motor() + motor_h();
function z_grip() = z_shoulder() + shoulder_h();
function z_taper() = z_grip() + grip_h();
function z_nose() = z_taper() + taper_h();
function z_tip() = z_nose() + nose_h();

function r_grip() = grip_diameter / 2;
function r_motor_od() = r_grip() * 0.88;
function r_waist() = r_grip() * 0.80;
function r_rca() = r_grip() * 0.72;
function r_nose() = 5.2;
function needle_stroke() = 2 * cam_eccentricity;
function bore() = 3.2;

module spindle(z0, r0, z1, r1) {
    hull() {
        translate([0, 0, z0]) cylinder(h = 0.05, r = r0);
        translate([0, 0, z1]) cylinder(h = 0.05, r = r1);
    }
}

module body_outer() {
    spindle(z_rca(), r_rca() * 0.92, z_rca() + 4, r_rca() * 1.08);
    spindle(z_rca() + 4, r_rca() * 1.08, z_motor(), r_motor_od());
    spindle(z_motor(), r_motor_od(), z_shoulder(), r_motor_od() * 1.04);
    spindle(z_shoulder(), r_motor_od() * 1.04, z_grip(), r_waist());
    spindle(z_grip(), r_waist(), z_taper() - 6, r_grip());
    spindle(z_taper() - 6, r_grip(), z_taper(), r_grip() * 0.96);
    spindle(z_taper(), r_grip() * 0.96, z_nose(), r_nose() + 2.2);
    spindle(z_nose(), r_nose() + 2.2, z_tip() - 2, r_nose());
    translate([0, 0, z_tip() - 2]) cylinder(h = 2, r1 = r_nose(), r2 = r_nose() - 0.8);
}

module body_inner() {
    wt = wall_thickness;
    spindle(z_rca() + 1.2, r_rca() * 0.92 - wt, z_motor() + 1, r_motor_od() - wt);
    spindle(z_motor() + 1, r_motor_od() - wt, z_shoulder() - 1, r_motor_od() - wt);
    spindle(z_shoulder() - 1, r_motor_od() - wt, z_grip() + 2, r_waist() - wt);
    translate([0, 0, z_grip() + 2])
        cylinder(h = grip_h() + taper_h() + nose_h() - 4, r = max(4.2, bore() / 2 + 2.4));
}

module diamond_knurl() {
    if (show_knurl && knurl_depth > 0) {
        rings = min(10, max(3, floor((grip_h() - 8) / knurl_pitch)));
        around = min(18, max(12, floor(2 * 3.14159 * r_grip() / knurl_pitch)));
        intersection() {
            translate([0, 0, z_grip() + 4])
            difference() {
                cylinder(h = grip_h() - 8, r = r_grip() + knurl_depth);
                translate([0, 0, -0.2])
                    cylinder(h = grip_h() - 7.6, r = r_grip() - 0.12);
            }
            translate([0, 0, z_grip() + 4])
            for (iz = [0 : rings - 1], ia = [0 : around - 1]) {
                rotate([0, 0, ia * 360 / around + (iz % 2) * 180 / around])
                translate([r_grip(), 0, iz * knurl_pitch + knurl_pitch / 2])
                rotate([45, 0, 0])
                    cube([knurl_depth * 4, knurl_pitch * 0.7, knurl_pitch * 0.7], center = true);
            }
        }
    }
}

module grip_grooves() {
    for (i = [0 : 4])
        translate([0, 0, z_grip() + 7 + i * (grip_h() - 14) / 4])
        rotate_extrude(convexity = 4)
        translate([r_grip() - 0.05, 0, 0])
            circle(d = 0.7);
}

module oval_window() {
    translate([r_waist() - 1, 0, z_grip() + grip_h() * 0.42])
    rotate([0, 90, 0])
    scale([1.7, 0.55, 1])
        cylinder(h = 8, r = 4.6, center = true);
}

function screw_stations() = [
    [0, r_motor_od() * 0.55, z_motor() + 7],
    [0, -r_motor_od() * 0.55, z_motor() + motor_h() - 7],
    [0, r_waist() * 0.45, z_grip() + 10],
    [0, -r_waist() * 0.45, z_taper() - 8]
];

module housing_screws_cut() {
    for (p = screw_stations()) {
        translate(p) rotate([0, 90, 0]) {
            cylinder(h = 40, r = 2.7 / 2, center = true);          // M2.5 过孔 +0.2
            translate([0, 0, 6.2]) cylinder(h = 3.2, r1 = 2.4, r2 = 1.2); // 沉头
            translate([0, 0, -8.5]) cylinder(h = 6, r = 2.1);       // 螺柱
        }
    }
}

module locator_pins(as_holes = false) {
    r = as_holes ? 1.15 : 1.0;
    for (z = [z_motor() + motor_h() / 2, z_grip() + grip_h() * 0.55]) {
        translate([0, r_waist() * 0.62, z])
            rotate([0, 90, 0]) cylinder(h = 4.5, r = r, center = true);
        translate([0, -r_waist() * 0.62, z])
            rotate([0, 90, 0]) cylinder(h = 4.5, r = r, center = true);
    }
}

module seam_rebate() {
    translate([0, 0, z_tip() / 2])
        cube([0.3, 80, z_tip() + 2], center = true);
}

module housing_shell(side = 1) {
    difference() {
        intersection() {
            union() {
                body_outer();
                diamond_knurl();
            }
            translate([side * 60, 0, z_tip() / 2])
                cube([120 - 0.15, 80, z_tip() + 4], center = true);
        }
        body_inner();
        if (window_open) oval_window();
        housing_screws_cut();
        seam_rebate();
        grip_grooves();
        // 电机舱
        translate([0, 0, z_motor() + 4])
            cylinder(h = motor_length + 0.6, r = motor_diameter / 2 + 0.25);
        // 导向套座
        translate([0, 0, z_grip() + 6])
            cylinder(h = 10.4, r = 3.15);
        translate([0, 0, z_taper() - 4])
            cylinder(h = 10.4, r = 3.15);
        // 线夹让位
        translate([r_motor_od() + 0.2, 0, z_motor() + motor_h() * 0.55])
            cube([4, 8, 10], center = true);
        if (side < 0) locator_pins(as_holes = true);
    }
    if (side > 0)
        difference() {
            locator_pins(as_holes = false);
            body_inner();
        }
}

module housing_left()  { housing_shell(-1); }
module housing_right() { housing_shell(1); }

module grip_sleeve() {
    difference() {
        union() {
            translate([0, 0, z_grip() + 3])
                cylinder(h = grip_h() - 6, r = r_grip() + 0.15);
            diamond_knurl();
        }
        translate([0, 0, z_grip() + 2])
            cylinder(h = grip_h(), r = r_grip() - 0.9);
        if (window_open) oval_window();
    }
}

module cartridge_nose() {
    difference() {
        union() {
            spindle(z_nose() - 3, r_nose() + 2.4, z_tip() - 2, r_nose());
            translate([0, 0, z_tip() - 2])
                cylinder(h = 2, r1 = r_nose(), r2 = r_nose() - 0.8);
            // 卡台
            translate([0, 0, z_nose() + 2])
                cylinder(h = 1.2, r = r_nose() + 0.6);
        }
        translate([0, 0, z_nose() - 4])
            cylinder(h = nose_h() + 8, r = bore() / 2);
        translate([0, 0, z_tip() - 7])
            cylinder(h = 5.2, r = 3.25); // 卡式针头腔
        translate([0, 0, z_tip() - 5.2])
            rotate_extrude()
            translate([3.05, 0, 0]) circle(r = 0.45); // 弹片槽
        translate([0, 0, z_tip() - 0.6])
            cylinder(h = 0.7, r1 = bore() / 2 + 0.6, r2 = bore() / 2); // C0.6
    }
}

module rca_cap() {
    difference() {
        union() {
            spindle(z_rca(), r_rca() * 0.92, z_rca() + 4, r_rca() * 1.08);
            spindle(z_rca() + 4, r_rca() * 1.08, z_motor() + 1.5, r_motor_od());
            // 防转缺口凸台
            translate([r_rca() * 1.02, 0, z_rca() + 2])
                cube([1.6, 3.2, 6], center = true);
        }
        translate([0, 0, z_rca() + 1])
            cylinder(h = rca_h() + 4, r = r_rca() * 0.92 - wall_thickness);
        // RCA 外环 φ8 × 12
        translate([0, 0, z_rca() - 0.2])
            cylinder(h = 12.2, r = 4.1);
        // 中心针孔 φ3.2
        translate([0, 0, z_rca() - 0.2])
            cylinder(h = 14, r = 1.6);
        // 防转缺口
        translate([-r_rca() * 0.55, 0, z_rca() - 0.2])
            cube([2.2, 3.4, 5], center = true);
        housing_screws_cut();
    }
}

module motor() {
    translate([0, 0, z_motor() + 5]) {
        cylinder(h = motor_length, r = motor_diameter / 2);
        translate([0, 0, motor_length])
            cylinder(h = 2.2, r = 2.5); // 后端凸台
        translate([0, 0, motor_length + 2.2])
            cylinder(h = 8, r = 1.0);   // 轴 φ2
        // 两颗焊盘示意
        for (a = [-1, 1])
            translate([a * 4.2, 0, -0.4])
                cylinder(h = 0.6, r = 0.9);
    }
}

module cam() {
    z = z_motor() + 5 + motor_length + 2.2 + 2;
    translate([cam_eccentricity, 0, z]) {
        difference() {
            cylinder(h = 4, r = 4);
            translate([-cam_eccentricity, 0, -0.2])
                cylinder(h = 4.4, r = 1.125); // 轴孔 +0.25
            rotate([0, 90, 0])
                translate([-2, 0, 1.2])
                cylinder(h = 5, r = 1.0);     // M2 顶丝
        }
    }
}

module needle_bar() {
    z0 = z_motor() + 5 + motor_length + 6;
    lift = stroke_preview * needle_stroke();
    translate([0, 0, z0 + lift]) {
        cube([3, 3, 52], center = false);
        translate([1.5, 1.5, 52])
            cylinder(h = 8, r = 1.0);
        // 凸轮从动槽
        translate([1.5, 1.5, 0])
        difference() {
            cube([5, 5, 6], center = true);
            cube([5.2, 2.2, 4.2], center = true);
        }
    }
}

module return_spring() {
    z0 = z_motor() + 5 + motor_length + 14;
    h = 12;
    translate([0, 0, z0])
    for (i = [0 : 7]) {
        translate([0, 0, i * h / 8])
        rotate_extrude(convexity = 4)
        translate([2.25, 0, 0])
            circle(d = 0.5);
    }
}

module linear_bushing(z) {
    translate([0, 0, z])
    difference() {
        cylinder(h = 10, r = 3.0);
        translate([0, 0, -0.2])
            cylinder(h = 10.4, r = bore() / 2);
    }
}

module cable_clip() {
    translate([r_motor_od() + 1.6, 0, z_motor() + motor_h() * 0.55])
    rotate([90, 0, 90])
    difference() {
        cylinder(h = 8, r = 3.6, center = true);
        cylinder(h = 8.4, r = 1.85, center = true); // 3.5 硅胶线
        translate([2.4, 0, 0])
            cube([4, 8, 9], center = true);
    }
}

module pcb_pocket() {
    translate([0, 0, z_motor() + 5 + motor_length + 0.8])
        cube([18, 12, 1.6], center = true);
    for (x = [-6, 6])
        translate([x, 4, z_motor() + 5 + motor_length - 1])
            cylinder(h = 4, r = 1.1);
}

module rca_jack() {
    translate([0, 0, z_rca() + 0.2]) {
        difference() {
            cylinder(h = 12, r = 4.0);
            translate([0, 0, -0.2]) cylinder(h = 10, r = 3.2);
        }
        cylinder(h = 11, r = 1.4); // 中心针
    }
}

module cartridge() {
    translate([0, 0, z_tip() - 6]) {
        cylinder(h = 6.5, r = 3.15);
        translate([0, 0, 6.5])
            cylinder(h = 16, r1 = 2.7, r2 = 1.6);
        translate([0, 0, 22])
            cylinder(h = 8, r = 1.35);
        // 三针 grouping
        for (a = [0, 120, 240])
            rotate([0, 0, a])
            translate([0.55, 0, 22])
                cylinder(h = 11, r = 0.18);
        // 尾部卡扣
        translate([0, 0, 1.8])
            cylinder(h = 1.1, r = 3.55);
    }
}

module depth_ring() {
    difference() {
        translate([0, 0, z_taper() + 1])
            cylinder(h = 7, r = r_grip() * 0.90);
        translate([0, 0, z_taper() + 0.8])
            cylinder(h = 7.4, r = r_grip() * 0.90 - 1.8);
        for (a = [0 : 15 : 359])
            rotate([0, 0, a])
            translate([r_grip() * 0.90 - 0.2, 0, z_taper() + 4.5])
                cube([0.6, 0.35, 2.2], center = true);
    }
}

module m25_screw(p) {
    translate([r_motor_od() * 0.95, p[1], p[2]])
    rotate([0, 90, 0]) {
        cylinder(h = 1.5, r1 = 2.2, r2 = 1.15);
        translate([0, 0, -7]) cylinder(h = 8, r = 1.25);
    }
}

module assembly() {
    xl = -explode * 6;
    xr = explode * 6;
    z_ex = explode;

    color(shell_color)
        translate([xl, 0, 0]) housing_left();
    if (!cutaway)
        color(shell_color)
            translate([xr, 0, 0]) housing_right();

    color(nose_color)
        translate([0, 0, z_ex * 1.1]) cartridge_nose();

    color("#1C1C1E")
        translate([0, 0, -z_ex * 0.8]) rca_cap();

    color("#888888")
        translate([0, 0, z_ex * 0.7]) depth_ring();

    color(motor_color)
        translate([explode * 0.4, 0, z_ex * 0.2]) motor();

    color(cam_color)
        translate([explode * 0.5, 0, z_ex * 0.35]) cam();

    color(bar_color)
        translate([0, 0, z_ex * 0.55])
        translate([-1.5, -1.5, 0]) needle_bar();

    color(spring_color)
        translate([0, 0, z_ex * 0.45]) return_spring();

    color("#5A5A5A") {
        linear_bushing(z_grip() + 6);
        linear_bushing(z_taper() - 4);
    }

    color("#3D3D3D")
        translate([explode * 1.2, 0, 0]) cable_clip();

    color("#1B4D3E")
        pcb_pocket();

    color("Gold")
        translate([0, 0, -z_ex * 0.8]) rca_jack();

    color(cartridge_color)
        translate([0, 0, z_ex * 1.6]) cartridge();

    color("DimGray")
    if (!cutaway)
        for (p = screw_stations()) m25_screw(p);
}

module exported_part() {
    if (print_part == "housing_left") housing_left();
    else if (print_part == "housing_right") housing_right();
    else if (print_part == "grip_sleeve") grip_sleeve();
    else if (print_part == "cartridge_nose") cartridge_nose();
    else if (print_part == "rca_cap") rca_cap();
    else if (print_part == "cam") cam();
    else if (print_part == "needle_bar") translate([-1.5, -1.5, 0]) needle_bar();
    else if (print_part == "cable_clip") cable_clip();
    else assembly();
}

exported_part();
