CREATE DATABASE medibot;
CREATE USER 'medibot_user'@'localhost' IDENTIFIED BY 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON medibot.* TO 'medibot_user'@'localhost';
FLUSH PRIVILEGES;