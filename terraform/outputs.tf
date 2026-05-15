###############################################################
#  outputs.tf  — paste these into GitHub Secrets
###############################################################

output "vps_elastic_ip" {
  description = "→ GitHub Secret: VPS_HOST"
  value       = aws_eip.facidance.public_ip
}

output "vps_user" {
  description = "→ GitHub Secret: VPS_USER"
  value       = "ubuntu"
}

output "vps_ssh_key_path" {
  description = "Private key saved here — use contents as VPS_SSH_KEY secret"
  value       = local_sensitive_file.private_key_pem.filename
}

output "aws_sg_id" {
  description = "→ GitHub Secret: AWS_SG_ID"
  value       = aws_security_group.facidance.id
}

output "github_actions_access_key_id" {
  description = "→ GitHub Secret: AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.github_actions.id
}

output "github_actions_secret_access_key" {
  description = "→ GitHub Secret: AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.facidance.id
}

output "ami_used" {
  description = "Ubuntu 22.04 AMI resolved"
  value       = data.aws_ami.ubuntu_22_04.id
}
