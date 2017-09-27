terraform {
  backend "s3" {
    bucket = "newco-remote-state-master"
    key    = "em-child"
    region = "eu-west-1"
  }
}

variable "stack" {}

variable "bucket" {}

variable "master_account" {}

variable "ec2_key_pair" {}

variable "ec2_key_pair_path" {}

variable "platform_users" {
  default = {
    xenial  = "ubuntu"
    trusty  = "ubuntu"
    rhel6   = "ec2-user"
    centos6 = "centos"
    centos7 = "centos"
    rhel7   = "ec2-user"
  }
}

variable vpc_id {}

variable "subnet_id" {}

variable "num_servers" {
  default = 3
}

variable "platform" {
  default     = "xenial"
  description = "The OS Platform"
}

variable "ami" {
  description = "AWS AMI Id, if you change, make sure it is compatible with instance type, not all AMIs allow all instance types "

  default = {
    us-east-1-trusty      = "ami-79f66d6f"
    us-east-2-trusty      = "ami-b7075dd2"
    us-west-1-trusty      = "ami-4ab2962a"
    us-west-2-trusty      = "ami-e01d8280"
    eu-west-1-trusty      = "ami-9d8283fb"
    eu-central-1-trusty   = "ami-46df0329"
    sa-east-1-trusty      = "ami-9595f8f9"
    ap-northeast-1-trusty = "ami-15b89372"
    ap-northeast-2-trusty = "ami-58af6136"
    ap-southeast-1-trusty = "ami-a2e45fc1"
    ap-southeast-2-trusty = "ami-f31c1490"
    ap-south-1-xenial     = "ami-c2ee9dad"
    us-east-1-xenial      = "ami-80861296"
    ap-northeast-1-xenial = "ami-afb09dc8"
    eu-west-1-xenial      = "ami-a8d2d7ce"
    ap-southeast-1-xenial = "ami-8fcc75ec"
    ca-central-1-xenial   = "ami-b3d965d7"
    us-west-1-xenial      = "ami-2afbde4a"
    eu-central-1-xenial   = "ami-060cde69"
    sa-east-1-xenial      = "ami-4090f22c"
    cn-north-1-xenial     = "ami-a163b4cc"
    us-gov-west-1-xenial  = "ami-ff22a79e"
    ap-southeast-2-xenial = "ami-96666ff5"
    eu-west-2-xenial      = "ami-f1d7c395"
    ap-northeast-2-xenial = "ami-66e33108"
    us-west-2-xenial      = "ami-efd0428f"
    us-east-2-xenial      = "ami-618fab04"
    us-east-1-rhel6       = "ami-0d28fe66"
    us-east-2-rhel6       = "ami-aff2a9ca"
    us-west-2-rhel6       = "ami-3d3c0a0d"
    us-east-1-centos6     = "ami-57cd8732"
    us-east-2-centos6     = "ami-c299c2a7"
    us-west-2-centos6     = "ami-1255b321"
    us-east-1-rhel7       = "ami-2051294a"
    us-east-2-rhel7       = "ami-0a33696f"
    us-west-2-rhel7       = "ami-775e4f16"
    us-east-1-centos7     = "ami-6d1c2007"
    us-east-2-centos7     = "ami-6a2d760f"
    us-west-1-centos7     = "ami-af4333cf"
  }
}

variable "service_conf" {
  default = {
    trusty  = "debian_upstart.conf"
    xenial  = "debian_consul.service"
    rhel6   = "rhel_upstart.conf"
    centos6 = "rhel_upstart.conf"
    centos7 = "rhel_consul.service"
    rhel7   = "rhel_consul.service"
  }
}

variable "service_conf_dest" {
  default = {
    trusty  = "upstart.conf"
    xenial  = "consul.service"
    rhel6   = "upstart.conf"
    centos6 = "upstart.conf"
    centos7 = "consul.service"
    rhel7   = "consul.service"
  }
}
