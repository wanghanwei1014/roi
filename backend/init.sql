-- 创建数据库
CREATE DATABASE IF NOT EXISTS roi_analysis
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE roi_analysis;

-- 创建ROI数据表
CREATE TABLE IF NOT EXISTS roi_data (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  date            DATE NOT NULL                       COMMENT '投放日期',
  day_of_week     VARCHAR(10)                         COMMENT '星期几',
  app             VARCHAR(20) NOT NULL                COMMENT '应用名称',
  bid_type        VARCHAR(10) NOT NULL DEFAULT 'CPI'  COMMENT '出价类型',
  country         VARCHAR(20) NOT NULL                COMMENT '国家地区',
  installs        INT NOT NULL DEFAULT 0              COMMENT '应用安装总次数',
  roi_day0        DECIMAL(10,2) DEFAULT 0             COMMENT '当日ROI(%)',
  roi_day1        DECIMAL(10,2) DEFAULT 0             COMMENT '1日ROI(%)',
  roi_day3        DECIMAL(10,2) DEFAULT 0             COMMENT '3日ROI(%)',
  roi_day7        DECIMAL(10,2) DEFAULT 0             COMMENT '7日ROI(%)',
  roi_day14       DECIMAL(10,2) DEFAULT 0             COMMENT '14日ROI(%)',
  roi_day30       DECIMAL(10,2) DEFAULT 0             COMMENT '30日ROI(%)',
  roi_day60       DECIMAL(10,2) DEFAULT 0             COMMENT '60日ROI(%)',
  roi_day90       DECIMAL(10,2) DEFAULT 0             COMMENT '90日ROI(%)',
  insufficient_day0   TINYINT(1) DEFAULT 0            COMMENT '当日ROI日期不足标识',
  insufficient_day1   TINYINT(1) DEFAULT 0            COMMENT '1日ROI日期不足标识',
  insufficient_day3   TINYINT(1) DEFAULT 0            COMMENT '3日ROI日期不足标识',
  insufficient_day7   TINYINT(1) DEFAULT 0            COMMENT '7日ROI日期不足标识',
  insufficient_day14  TINYINT(1) DEFAULT 0            COMMENT '14日ROI日期不足标识',
  insufficient_day30  TINYINT(1) DEFAULT 0            COMMENT '30日ROI日期不足标识',
  insufficient_day60  TINYINT(1) DEFAULT 0            COMMENT '60日ROI日期不足标识',
  insufficient_day90  TINYINT(1) DEFAULT 0            COMMENT '90日ROI日期不足标识',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_app (app),
  INDEX idx_country (country),
  INDEX idx_date (date),
  INDEX idx_app_country_date (app, country, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='广告ROI数据表';
