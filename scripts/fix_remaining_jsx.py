#!/usr/bin/env python3
"""
Fix the remaining JSX parsing errors by ensuring closing tags are on their own lines.
"""

import re
import sys

# File paths and their problematic line numbers
fixes = {
    "/app/web-admin/app/page-layout-mapper/page.tsx": [
        {
            "search": r"                      </div></div>\n                      </div>\n        </div>",
            "replace": "                      </div>\n                    </div>\n                  </div>\n                </div>\n              </div>\n            </div>\n          </div>"
        }
    ],
    "/app/web-admin/app/preview-new-design/page.tsx": [
        {
            "search": r"              </div>\n            </div>\n        </div>",
            "replace": "              </div>\n            </div>\n          </div>\n        </div>"
        }
    ],
    "/app/web-admin/app/projects/[id]/page.tsx": [
        {
            "search": r"            </button></div>\n          \);\n  }",
            "replace": "            </button>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n  }"
        }
    ],
    "/app/web-admin/app/services/[id]/edit/page.tsx": [
        {
            "search": r"          \)}\n              </div>\n        </div>",
            "replace": "          )}\n              </div>\n            </div>\n          </div>\n        </div>"
        }
    ],
    "/app/web-admin/app/settings/equipment-forms/page.tsx": [
        {
            "search": r"                            </option>\n                        </div>",
            "replace": "                            </option>\n                          ))}\n                        </select>\n                      </div>"
        }
    ],
    "/app/web-admin/app/settings/permissions-matrix/page.tsx": [
        {
            "search": r"              {role}\n            </button>\n        </div>",
            "replace": "              {role}\n            </button>\n          ))}\n        </div>"
        }
    ],
    "/app/web-admin/app/team/[id]/page.tsx": [
        {
            "search": r"                  </a>\n                </div>\n        </div>",
            "replace": "                  </a>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>"
        }
    ],
    "/app/web-admin/app/templates/[type]/[id]/edit/page.tsx": [
        {
            "search": r"        </div></div>\n      </div></div>\n    </div></div>",
            "replace": "        </div>\n      </div>\n      </div>\n    </div>\n  </div>"
        }
    ]
}

def fix_file(filepath, fixes_list):
    """Apply fixes to a file."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original_content = content
        
        for fix in fixes_list:
            content = re.sub(fix['search'], fix['replace'], content)
        
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"✓ Fixed {filepath}")
            return True
        else:
            print(f"⚠ No changes made to {filepath}")
            return False
    except Exception as e:
        print(f"✗ Error fixing {filepath}: {e}")
        return False

def main():
    """Main function."""
    print("Fixing remaining JSX parsing errors...")
    fixed_count = 0
    
    for filepath, fixes_list in fixes.items():
        if fix_file(filepath, fixes_list):
            fixed_count += 1
    
    print(f"\n{fixed_count}/{len(fixes)} files fixed")
    return 0 if fixed_count > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
