<b>This is schema written in Mysql workBench</b>

create database Event_Booking_System;
use Event_Booking_System;

create table person(
id int primary key auto_increment,
name varchar(50) not null,
email varchar(100) unique not null,
password varchar(255) not null,
role enum('admin','user') default 'user' not null,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE society (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  join_code VARCHAR(20) NOT NULL UNIQUE,
  description VARCHAR(500),
  president_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (president_id) REFERENCES person(id)
      on delete set null
      on update cascade
);

CREATE TABLE society_member (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  person_id INT NOT NULL,
  role ENUM('member', 'president', 'lead') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES society(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY unique_member (society_id, person_id)
);

CREATE TABLE event (
  id INT AUTO_INCREMENT PRIMARY KEY,
  society_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE,
  location VARCHAR(200),
  status ENUM('published', 'cancelled', 'completed') DEFAULT 'published',
  created_by INT,
  approved_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (society_id) REFERENCES society(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES person(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES person(id) ON DELETE SET NULL
);

CREATE TABLE event_draft (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT DEFAULT NULL,                -- linked once draft gets approved/published
  parent_draft_id INT DEFAULT NULL,         -- previous draft version, if any
  society_id INT NOT NULL,
  lead_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  proposed_date DATE,
  proposed_location VARCHAR(200),
  status ENUM('pending', 'approved', 'rejected', 'changes_requested') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_draft_id) REFERENCES event_draft(id) ON DELETE SET NULL,
  FOREIGN KEY (society_id) REFERENCES society(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES person(id) ON DELETE CASCADE
);

CREATE TABLE approval (
  id INT AUTO_INCREMENT PRIMARY KEY,
  draft_id INT NOT NULL,
  president_id INT NOT NULL,
  status ENUM('approved', 'rejected', 'changes_requested') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (draft_id) REFERENCES event_draft(id) ON DELETE CASCADE,
  FOREIGN KEY (president_id) REFERENCES person(id) ON DELETE CASCADE
);

CREATE TABLE event_registration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  person_id INT NOT NULL,
  status ENUM('registered', 'cancelled') DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  cancelled_at TIMESTAMP NULL,
  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE,
  
  UNIQUE KEY unique_registration (event_id, person_id)
);

CREATE TABLE event_feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  person_id INT NOT NULL,
  rating DECIMAL(2,1) CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (event_id) REFERENCES event(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES person(id) ON DELETE CASCADE,
  UNIQUE KEY unique_feedback (event_id, person_id)
);