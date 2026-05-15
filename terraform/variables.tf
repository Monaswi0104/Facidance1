###############################################################
#  variables.tf
###############################################################

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "aws_account_id" {
  description = "Your 12-digit AWS account ID"
  type        = string
  default     = "111242152168"
}

variable "owner_ipv4" {
  description = "Your personal IPv4 address (without /32)"
  type        = string
  default     = "49.37.103.97"
}

variable "owner_ipv6" {
  description = "Your personal IPv6 address (without /128)"
  type        = string
  default     = "2405:201:a80a:2080:91cb:8f56:bb86:121e"
}
