from datetime import datetime, time
from zk.attendance import Attendance


class Profile():

    start_time = time(8,30)
    end_time = time(3,30)

    start_allow = time(8,45)
    end_allow = time(3,15)


class Employee():
    name = "Ahmed"
    attendance_id = "181"
    data = []
    fingered_days = dict()

    def get_profile(self):
        return Profile()

    def determine_time(self):
        return 10

    def filter(self, device_data):
        self.data += [att for att in device_data if att.user_id == self.attendance_id or att.uid == 181]
        self.filter_per_day()
                # self.data.append(att)


    def work_days(self):
        return {k:v for k,v in self.fingered_days.items() if self.is_work_day(k,v)}

    def is_work_day(self, day, fingers):
        # if fingers[0].timestamp.time() < self.get_profile().start_time:
            
        # datetime.time()

        # for finger in fingers:
        return False

    def filter_per_day(self):
        for att in self.data:
            tm = f"{att.timestamp.year}-{att.timestamp.month}-{att.timestamp.day}"
            if tm in self.fingered_days.keys():
                self.fingered_days[tm].append(att)
            else:
                self.fingered_days[tm] = [att]

        return self.fingered_days
