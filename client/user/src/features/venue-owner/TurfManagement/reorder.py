import sys

def reorder_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define boundaries based on unique HTML/JSX comments or classes
    
    # 1. Base Structure
    header_end = content.find('{/* STEP 1')
    footer_start = content.find('{/* Navigation Buttons */}')
    
    header = content[:header_end]
    footer = content[footer_start:]
    
    # 2. Extract sections
    def extract(start_str, end_str):
        start = content.find(start_str)
        if start == -1: return ''
        end = content.find(end_str, start)
        if end == -1: return content[start:] # fallback
        return content[start:end]
        
    venue_name = extract('<div className="space-y-4">', '<div>\n                <label className="block text-[10px]')
    venue_desc = extract('<div>\n                <label className="block text-[10px]', '{/* Venue Policies and Rules */}')
    venue_policies = extract('{/* Venue Policies and Rules */}', '{/* Media & Offerings */}')
    media_offerings = extract('{/* Media & Offerings */}', '{/* STEP 2')
    
    location_setup = extract('{/* Location & Setup */}', '{/* Venue Managers */}')
    venue_managers = extract('{/* Venue Managers */}', '{/* STEP 3')
    
    legal_docs = extract('{/* Legal & Verification Documents */}', '{/* Slot Architecture */}')
    slot_arch = extract('{/* Slot Architecture */}', '{/* Navigation Buttons */}')
    
    # Reassemble
    
    # Step 1
    step_1 = '''{/* STEP 1 */}
          {currentStep === 1 && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 animate-fade-in">
              <div className="space-y-8">
                ''' + venue_name + '''
                ''' + media_offerings + '''
                ''' + venue_desc + '''
              </div>
              <div className="space-y-8">
                ''' + location_setup + '''
              </div>
            </div>
          )}
'''

    # Step 2
    step_2 = '''
          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10 animate-fade-in">
              <div className="space-y-8">
                ''' + legal_docs + '''
              </div>
              <div className="space-y-8">
                ''' + venue_managers + '''
                ''' + venue_policies + '''
              </div>
            </div>
          )}
'''

    # Step 3
    step_3 = '''
          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="col-span-1 md:col-span-2 relative z-10 animate-fade-in">
              ''' + slot_arch + '''
            </div>
          )}
'''

    new_content = header + step_1 + step_2 + step_3 + '\n          ' + footer
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

reorder_file(r'c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\src\features\venue-owner\TurfManagement\AddTurf.jsx')
reorder_file(r'c:\Users\saavi\OneDrive\Desktop\kridaz\kridaz\client\user\src\features\venue-owner\TurfManagement\EditTurf.jsx')
print('Done reordering')
